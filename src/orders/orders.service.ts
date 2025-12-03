import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Order, OrderStatus } from './entities/order.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateOrderDto } from 'src/orders/dto/create-order.dto';
import { User } from 'src/users/entities/user.entity';
import { Address } from 'src/addresses/entities/address.entity';
import { Product } from 'src/products/entities/product.entity';
import { OrderItem } from './entities/order-item.entity';
import { ImpactStatsDto } from './dto/impact-stats.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BrandSaleEvent,
  OrderPaidEvent,
  StockAlertEvent,
} from 'src/notifications/notifications.service';
import { OrderPaidWalletEvent } from 'src/wallet/listeners/order-paid.event';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createOrderDto: CreateOrderDto, user: User) {
    const { addressId, items } = createOrderDto;
    const stockAlerts: StockAlertEvent[] = [];
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const address = await queryRunner.manager.findOne(Address, {
        where: { id: addressId, user: { id: user.id } },
      });
      if (!address)
        throw new NotFoundException('Dirección de envío no encontrada');

      const newOrder = new Order();
      newOrder.user = user;
      newOrder.status = OrderStatus.PENDING;
      newOrder.totalPrice = 0;
      newOrder.totalCarbonFootprint = 0;
      newOrder.items = [];

      for (const itemDto of items) {
        const product = await queryRunner.manager.findOne(Product, {
          where: { id: itemDto.productId },
          relations: ['environmentalImpact', 'brand', 'brand.owner'],
        });

        if (!product) {
          throw new NotFoundException('Producto no encontrado');
        }

        if (product.stock < itemDto.quantity) {
          throw new BadRequestException(
            `Stock insuficiente para el producto: ${product.name}`,
          );
        }

        const orderItem = new OrderItem();
        orderItem.product = product;
        orderItem.quantity = itemDto.quantity;

        orderItem.priceAtPurchase = product.price;

        const realEcoImpact = Number(
          product.environmentalImpact?.carbonFootprint || 0,
        );
        orderItem.carbonFootprintSnapshot = realEcoImpact;

        newOrder.totalPrice += Number(product.price) * itemDto.quantity;
        newOrder.totalCarbonFootprint += realEcoImpact * itemDto.quantity;

        product.stock -= itemDto.quantity;
        await queryRunner.manager.save(product);

        if (product.stock === 0 || product.stock <= 5) {
          stockAlerts.push({
            email: product.brand.owner.email,
            brandName: product.brand.name,
            productName: product.name,
            stock: product.stock,
          });
        }

        newOrder.items.push(orderItem);
      }

      const savedOrder = await queryRunner.manager.save(Order, newOrder);

      for (const item of newOrder.items) {
        item.order = savedOrder;
        await queryRunner.manager.save(OrderItem, item);
      }

      await queryRunner.commitTransaction();

      return {
        orderId: savedOrder.id,
        totalPrice: savedOrder.totalPrice,
        totalCarbonFootprint: savedOrder.totalCarbonFootprint,
        message: 'Orden creada.',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll(user: User) {
    return this.orderRepository.find({
      where: { user: { id: user.id } },
      relations: ['items', 'items.product'],
      order: { createdAt: 'DESC' },
    });
  }

  async markAsPaid(orderId: string): Promise<void> {
    console.log(`🔍 Intentando marcar orden ${orderId} como pagada...`); // <--- LOG 1: Entrada

    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user'],
    });

    // Validar si existe la orden y ver su estado actual en el log
    if (!order) {
      console.log('❌ Orden no encontrada');
      return;
    }

    console.log(`Estado actual de la orden: ${order.status}`); // <--- LOG 2: Estado real

    // Aquí está el sospechoso:
    if (order.status !== OrderStatus.PENDING) {
      console.log('⚠️ La orden ya no está PENDIENTE, abortando...'); // <--- LOG 3: Early Return
      return;
    }

    this.notifyUserSuccess(order);

    await this.notifyBrandsOfSale(orderId);

    const walletEvent = new OrderPaidWalletEvent();
    walletEvent.orderId = order.id;
    walletEvent.userId = order.user.id;
    walletEvent.totalAmount = Number(order.totalPrice);
    const co2 = Number(order.totalCarbonFootprint);
    walletEvent.totalCo2Saved = !isNaN(co2) ? co2 : 0;

    console.log('🚀 Emitiendo evento de Wallet:', walletEvent); // <--- LOG 4: Éxito

    this.eventEmitter.emit('order.paid', walletEvent);

    order.status = OrderStatus.PAID;
    await this.orderRepository.save(order);
  }

  private notifyUserSuccess(order: Order): void {
    const eventPayload: OrderPaidEvent = {
      orderId: order.id,
      email: order.user.email,
      name: order.user.firstName || 'Eco-Amigo',
      totalPrice: Number(order.totalPrice),
      co2Saved: Number(order.totalCarbonFootprint),
    };

    this.eventEmitter.emit('order.paid', eventPayload);
  }

  private async notifyBrandsOfSale(orderId: string): Promise<void> {
    const fullOrder = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: [
        'items',
        'items.product',
        'items.product.brand',
        'items.product.brand.owner',
      ],
    });

    if (!fullOrder) return;

    const brandGroups = this.groupItemsByBrand(fullOrder);

    for (const group of brandGroups.values()) {
      this.eventEmitter.emit('brand.sale', group);
    }
  }

  private groupItemsByBrand(order: Order): Map<string, BrandSaleEvent> {
    const groups = new Map<string, BrandSaleEvent>();

    for (const item of order.items) {
      const brand = item.product.brand;
      const brandId = brand.id;

      if (!groups.has(brandId)) {
        groups.set(brandId, {
          email: brand.owner.email,
          brandName: brand.name,
          items: [],
          totalRevenue: 0,
        });
      }

      let group = groups.get(brandId);

      if (!group) {
        group = {
          email: brand.owner.email,
          brandName: brand.name,
          items: [],
          totalRevenue: 0,
        };
        groups.set(brandId, group);
      }

      group.items.push({
        productName: item.product.name,
        quantity: item.quantity,
        price: Number(item.priceAtPurchase),
      });

      group.totalRevenue += Number(item.priceAtPurchase) * item.quantity;
    }

    return groups;
  }

  async getUserImpactStats(userId: string): Promise<ImpactStatsDto> {
    const { totalCo2, count } = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalCarbonFootPrint)', 'totalCo2')
      .addSelect('COUNT(order.id)', 'count')
      .where('order.user_id = :userId', { userId })
      .andWhere('order.status = :status', { status: OrderStatus.PAID })
      .getRawOne();

    const co2Val = Number(totalCo2) || 0;
    const ordersCount = Number(count) || 0;

    const trees = Math.floor(co2Val / 21);

    let ecoLevel = 'Semilla';
    let nextLevelGoal = 10;

    if (co2Val >= 10 && co2Val < 50) {
      ecoLevel = 'Brote Consciente';
      nextLevelGoal = 50;
    } else if (co2Val >= 50 && co2Val < 200) {
      ecoLevel = 'Guardián del Bosque';
      nextLevelGoal = 200;
    } else if (co2Val >= 200) {
      ecoLevel = 'Héroe Climático';
      nextLevelGoal = 1000;
    }

    return {
      totalOrders: ordersCount,
      co2SavedKg: Number(co2Val.toFixed(2)),
      treesEquivalent: trees,
      ecoLevel,
      nextLevelGoal,
    };
  }
}
