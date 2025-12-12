import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Brand } from './entities/brand.entity';
import { DataSource, Repository } from 'typeorm';
import { CreateBrandDto } from './dto/create-brand.dto';
import { User, UserRole } from 'src/users/entities/user.entity';
import { Order, OrderStatus } from 'src/orders/entities/order.entity';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { OrderShippedEvent } from 'src/notifications/notifications.service';
import { OrderItem } from 'src/orders/entities/order-item.entity';

@Injectable()
export class BrandsService {
  constructor(
    @InjectRepository(Brand)
    private readonly brandRepository: Repository<Brand>,
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    @InjectRepository(OrderItem)
    private readonly orderItemRepository: Repository<OrderItem>,
    private readonly dataSource: DataSource,
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

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const slug = createBrandDto.name
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-');

      const newBrand = this.brandRepository.create({
        ...createBrandDto,
        slug,
        owner: user,
      });

      const savedBrand = await queryRunner.manager.save(newBrand);

      if (user.role !== UserRole.ADMIN && user.role !== UserRole.BRAND_ADMIN) {
        user.role = UserRole.BRAND_ADMIN;

        await queryRunner.manager.save(user);
      }

      await queryRunner.commitTransaction();

      return savedBrand;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  async findAll() {
    return await this.brandRepository.find({
      relations: ['owner', 'products'],
    });
  }

  async findOne(id: string) {
    return await this.brandRepository.findOne({
      where: { owner: { id } },
      relations: ['owner', 'products'],
    });
  }

  async findBrandOrders(userId: string) {
    const brand = await this.findOneByOwnerId(userId);
    if (!brand) return [];

    return this.orderRepository
      .createQueryBuilder('order')
      .leftJoinAndSelect('order.items', 'item')
      .leftJoinAndSelect('item.product', 'product')
      .leftJoinAndSelect('order.user', 'user')
      .where('product.brandId = :brandId', { brandId: brand.id })
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

  async getBrandStats(userId: string) {
    const brand = await this.findOneByOwnerId(userId);
    if (!brand) throw new NotFoundException('No tienes una marca registrada');

    const stats = await this.orderItemRepository
      .createQueryBuilder('item')
      .leftJoin('item.product', 'product')
      .leftJoin('item.order', 'order')
      .where('product.brandId = :brandId', { brandId: brand.id })
      .andWhere('order.status = :status', { status: OrderStatus.PAID })
      .select('SUM(item.priceAtPurchase * item.quantity)', 'totalRevenue')
      .addSelect('SUM(item.quantity)', 'totalUnits')
      .addSelect('COUNT(DISTINCT order.id)', 'totalOrders')
      .getRawOne();

    return {
      totalRevenue: Number(stats.totalRevenue) || 0,
      totalUnitsSold: Number(stats.totalUnits) || 0,
      totalOrders: Number(stats.totalOrders) || 0,
    };
  }

  async findOneByOwnerId(ownerId: string): Promise<Brand> {
    const brand = await this.brandRepository.findOne({
      where: { owner: { id: ownerId } },
    });

    if (!brand) {
      throw new NotFoundException(
        `Marca no encontrada para el usuario con ID ${ownerId}`,
      );
    }
    return brand;
  }
}
