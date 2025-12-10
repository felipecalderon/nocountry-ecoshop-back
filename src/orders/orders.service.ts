import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Order, OrderStatus } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { CreateOrderDto } from './dto/create-order.dto';
import { User } from 'src/users/entities/user.entity';
import { ImpactStatsDto } from './dto/impact-stats.dto';
import { OrdersHelper } from './helper/orders.helper';
import { OrdersNotificationHelper } from './helper/orders-notification.helper';

@Injectable()
export class OrdersService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly dataSource: DataSource,
    private readonly eventEmitter: EventEmitter2,
    private readonly ordersHelper: OrdersHelper,
    private readonly ordersNotificationHelper: OrdersNotificationHelper,
  ) {}

  async create(createOrderDto: CreateOrderDto, user: User) {
    const { addressId, items, couponCode } = createOrderDto;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.ordersHelper.validateAddress(
        addressId,
        user.id,
        queryRunner.manager,
      );

      const { orderItems, totalPrice, totalCarbonFootprint, stockAlerts } =
        await this.ordersHelper.processOrderItems(items, queryRunner.manager);

      const newOrder = new Order();
      newOrder.user = user;
      newOrder.status = OrderStatus.PENDING;
      newOrder.totalPrice = totalPrice;
      newOrder.totalCarbonFootprint = totalCarbonFootprint;
      newOrder.items = orderItems;

      if (couponCode) {
        const { discountAmount } =
          await this.ordersHelper.validateAndApplyCoupon(
            couponCode,
            user,
            newOrder.totalPrice,
            queryRunner.manager,
          );
        newOrder.totalPrice = Math.max(0, newOrder.totalPrice - discountAmount);
      }

      const savedOrder = await queryRunner.manager.save(Order, newOrder);

      for (const item of orderItems) {
        item.order = savedOrder;
        await queryRunner.manager.save(OrderItem, item);
      }

      await queryRunner.commitTransaction();

      stockAlerts.forEach((alert) =>
        this.eventEmitter.emit('stock.alert', alert),
      );

      return {
        orderId: savedOrder.id,
        totalPrice: savedOrder.totalPrice,
        totalCarbonFootprint: savedOrder.totalCarbonFootprint,
        message: couponCode
          ? 'Orden creada con éxito. Descuento aplicado.'
          : 'Orden creada con éxito.',
      };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.ordersHelper.handleDBExceptions(error);
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
    const order = await this.orderRepository.findOne({
      where: { id: orderId },
      relations: ['user'],
    });

    if (!order) return;
    if (order.status !== OrderStatus.PENDING) return;

    await this.ordersNotificationHelper.processSuccessfulPayment(order);

    order.status = OrderStatus.PAID;
    await this.orderRepository.save(order);
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

    const { level, nextGoal } = this.ordersHelper.calculateEcoLevel(co2Val);

    return {
      totalOrders: ordersCount,
      co2SavedKg: Number(co2Val.toFixed(2)),
      treesEquivalent: trees,
      ecoLevel: level,
      nextGoal,
    };
  }

  async findAllOrdersAdmin(page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;

    const [orders, total] = await this.orderRepository.findAndCount({
      relations: ['user', 'items', 'items.product'],
      order: { createdAt: 'DESC' },
      take: limit,
      skip: skip,
    });

    return {
      data: orders,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }
}
