import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brand } from './entities/brand.entity';
import { Repository } from 'typeorm';
import { CreateBrandDto } from './dto/create-brand.dto';
import { User } from 'src/users/entities/user.entity';
import { Order, OrderStatus } from 'src/orders/entities/order.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderShippedEvent } from 'src/notifications/notifications.service';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async create(createBrandDto: CreateBrandDto, user: User) {
    const existingBrand = await this.brandRepository.findOne({
      where: { owner: { id: user.id } },
    });

    if (existingBrand) {
      throw new ConflictException(
        'Este usuario ya posee una marca registrada.',
      );
    }

    const slug = createBrandDto.name.toLowerCase().trim().replace(/\s+/g, '-');

    const newBrand = this.brandRepository.create({
      ...createBrandDto,
      slug,
      owner: user,
    });

    return await this.brandRepository.save(newBrand);
  }

  async findAll() {
    return await this.brandRepository.find({
      relations: ['owner', 'products'],
    });
  }

  async findOne(id: string) {
    return await this.brandRepository.findOne({
      where: { id },
      relations: ['owner', 'products'],
    });
  }

  async findBrandOrders(user: User) {
    const brand = await this.brandRepository.findOne({
      where: { owner: { id: user.id } },
    });

    if (!brand) {
      throw new BadRequestException(
        'No tienes una marca registrada para ver ventas.',
      );
    }

    return this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('item.product', 'product')
      .leftJoinAndSelect('order.user', 'customer')
      .where('product.brand_id = :brandId', { brandId: brand.id })
      .andWhere('order.status != :pending', { pending: 'pending' })
      .orderBy('order.createdAt', 'DESC')
      .getMany();
  }

  async updateOrderStatus(orderId: string, status: OrderStatus, user: User) {
    const brand = await this.brandRepository.findOne({
      where: { owner: { id: user.id } },
    });

    if (!brand) throw new BadRequestException('Usuario sin marca.');

    const order = await this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.user', 'user')
      .innerJoin('order.items', 'item')
      .innerJoin('item.product', 'product')
      .where('order.id = :orderId', { orderId })
      .andWhere('product.brand_id = :brandId', { brandId: brand.id })
      .getOne();

    if (!order) {
      throw new NotFoundException(
        'Orden no encontrada o no contiene productos de tu marca.',
      );
    }

    order.status = status;
    const savedOrder = await this.orderRepository.save(order);

    if (status === OrderStatus.SHIPPED) {
      const event: OrderShippedEvent = {
        email: order.user.email,
        name: order.user.firstName,
        orderId: order.id,
      };
      this.eventEmitter.emit('order.shipped', event);
    }

    return savedOrder;
  }

  async getBrandStats(user: User) {
    const brand = await this.brandRepository.findOne({
      where: { owner: { id: user.id } },
    });
    if (!brand) throw new BadRequestException('No tienes marca.');

    const stats = await this.orderRepository
      .createQueryBuilder('order')
      .innerJoin('order.items', 'item')
      .innerJoin('item.product', 'product')
      .select('SUM(item.priceAtPurchase * item.quantity)', 'totalRevenue')
      .addSelect('SUM(item.quantity)', 'totalUnitsSold')
      .addSelect('COUNT(DISTINCT order.id)', 'totalOrders')
      .where('product.brand_id = :brandId', { brandId: brand.id })
      .andWhere('order.status != :pending', { pending: 'pending' })
      .getRawOne();

    return {
      totalRevenue: Number(stats.totalRevenue) || 0,
      totalUnitsSold: Number(stats.totalUnitsSold) || 0,
      totalOrders: Number(stats.totalOrders) || 0,
    };
  }
}
