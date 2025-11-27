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

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly dataSource: DataSource,
  ) {}

  async create(createOrderDto: CreateOrderDto, user: User) {
    const { addressId, items } = createOrderDto;

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
          relations: ['environmentalImpact'],
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

  async markAsPaid(orderId: string) {
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
    });

    if (!order) {
      return;
    }

    if (order.status === OrderStatus.PENDING) {
      order.status = OrderStatus.PAID;
      await this.orderRepository.save(order);
    }
  }
}
