import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from 'src/orders/entities/order.entity';
import { User } from 'src/users/entities/user.entity';
import { AdminStatsDto } from './dto/admin-stats.dto';

@Injectable()
export class AdminService {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  async getDashboardStats(): Promise<AdminStatsDto> {
    const orderStats = await this.orderRepository
      .createQueryBuilder('order')
      .select('SUM(order.totalPrice)', 'totalRevenue')
      .addSelect('COUNT(order.id)', 'totalOrders')
      .addSelect('SUM(order.totalCarbonFootprint)', 'totalCo2Saved')
      .where('order.status = :status', { status: OrderStatus.PAID })
      .getRawOne();

    const totalUsers = await this.userRepository.count();

    return {
      totalRevenue: Number(orderStats.totalRevenue) || 0,
      totalOrders: Number(orderStats.totalOrders) || 0,
      totalCo2Saved: Number(orderStats.totalCo2Saved) || 0,
      totalUsers: totalUsers || 0,
    };
  }
}
