import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Order, OrderStatus } from 'src/orders/entities/order.entity';
import { User } from 'src/users/entities/user.entity';
import { AdminStatsDto } from './dto/admin-stats.dto';
import { BanUserDto } from './dto/ban-user.dto';
import { PaginationDto } from './dto/pagination.dto';

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

  async toggleUserBan(
    userId: string,
    banUserDto: BanUserDto,
    adminId: string,
  ): Promise<User> {
    if (userId === adminId) {
      throw new ConflictException(
        'No puedes banear tu propia cuenta de administrador.',
      );
    }

    const user = await this.userRepository.findOne({ where: { id: userId } });

    if (!user) {
      throw new NotFoundException(`Usuario con ID ${userId} no encontrado.`);
    }

    user.isBanned = banUserDto.isBanned;

    return this.userRepository.save(user);
  }

  async findAllUsers(paginationDto: PaginationDto) {
    const { page = 1, limit = 10 } = paginationDto;
    const skip = (page - 1) * limit;

    const [users, total] = await this.userRepository.findAndCount({
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
      select: [
        'id',
        'email',
        'firstName',
        'lastName',
        'role',
        'isBanned',
        'createdAt',
        'providerId',
      ],
    });

    return {
      data: users,
      meta: {
        total,
        page,
        lastPage: Math.ceil(total / limit),
      },
    };
  }
}
