import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import {
  BrandSaleEvent,
  OrderPaidEvent,
} from 'src/notifications/notifications.service';
import { OrderPaidWalletEvent } from 'src/wallet/listeners/order-paid.event';
import { Order } from '../entities/order.entity';

@Injectable()
export class OrdersNotificationHelper {
  constructor(
    @InjectRepository(Order)
    private readonly orderRepository: Repository<Order>,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  async processSuccessfulPayment(order: Order): Promise<void> {
    // 1. Notificar al Usuario
    this.notifyUserSuccess(order);

    // 2. Notificar a las Marcas
    await this.notifyBrandsOfSale(order.id);

    // 3. Integración Eco-Wallet
    this.emitWalletEvent(order);
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

  private emitWalletEvent(order: Order): void {
    const walletEvent = new OrderPaidWalletEvent();
    walletEvent.orderId = order.id;
    walletEvent.userId = order.user.id;
    walletEvent.totalAmount = Number(order.totalPrice);

    const co2 = Number(order.totalCarbonFootprint);
    walletEvent.totalCo2Saved = !isNaN(co2) ? co2 : 0;

    this.eventEmitter.emit('order.paid', walletEvent);
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

    // Emitir eventos por cada marca
    brandGroups.forEach((group) => {
      this.eventEmitter.emit('brand.sale', group);
    });
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

      const group = groups.get(brandId)!;

      group.items.push({
        productName: item.product.name,
        quantity: item.quantity,
        price: Number(item.priceAtPurchase),
      });

      group.totalRevenue += Number(item.priceAtPurchase) * item.quantity;
    }

    return groups;
  }
}
