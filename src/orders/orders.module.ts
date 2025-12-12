import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './entities/order.entity';
import { OrderItem } from './entities/order-item.entity';
import { OrdersService } from './orders.service';
import { OrdersController } from './orders.controller';
import { Product } from 'src/products/entities/product.entity';
import { Address } from 'src/addresses/entities/address.entity';
import { OrdersHelper } from './helper/orders.helper';
import { OrdersNotificationHelper } from './helper/orders-notification.helper';

@Module({
  imports: [TypeOrmModule.forFeature([Order, OrderItem, Product, Address])],
  controllers: [OrdersController],
  providers: [OrdersService, OrdersHelper, OrdersNotificationHelper],
  exports: [OrdersService],
})
export class OrdersModule {}
