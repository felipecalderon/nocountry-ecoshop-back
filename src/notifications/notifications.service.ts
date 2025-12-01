import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { MailerService } from '@nestjs-modules/mailer';

export class OrderPaidEvent {
  orderId: string;
  email: string;
  name: string;
  totalPrice: number;
  co2Saved: number;
}

export class UserRegisteredEvent {
  email: string;
  name: string;
}

export class OrderShippedEvent {
  email: string;
  name: string;
  orderId: string;
}

export class BrandSaleEvent {
  email: string;
  brandName: string;
  totalRevenue: number;
  items: { productName: string; quantity: number; price: number }[];
}

export class StockAlertEvent {
  email: string;
  brandName: string;
  productName: string;
  stock: number;
}

@Injectable()
export class NotificationsService {
  constructor(private readonly mailerService: MailerService) {}

  @OnEvent('order.paid')
  async handleOrderPaid(payload: OrderPaidEvent) {
    console.log(
      `📧 Enviando email a ${payload.email} por Orden ${payload.orderId}...`,
    );

    try {
      await this.mailerService.sendMail({
        to: payload.email,
        subject: '¡Tu compra en EcoShop ha sido confirmada! 🌱',
        template: 'order-confirmation',
        context: {
          name: payload.name,
          orderId: payload.orderId.slice(0, 8),
          totalPrice: payload.totalPrice,
          co2Saved: payload.co2Saved,
        },
      });
      console.log('✅ Email enviado exitosamente.');
    } catch (error) {
      console.error('❌ Error enviando email:', error);
    }
  }

  @OnEvent('user.registered')
  async handleUserRegistered(payload: UserRegisteredEvent) {
    console.log(`📧 Enviando bienvenida a ${payload.email}...`);
    try {
      await this.mailerService.sendMail({
        to: payload.email,
        subject: 'Bienvenido a la comunidad EcoShop 🌱',
        template: 'welcome',
        context: {
          name: payload.name,
        },
      });
    } catch (error) {
      console.error('❌ Error enviando bienvenida:', error);
    }
  }

  @OnEvent('order.shipped')
  async handleOrderShipped(payload: OrderShippedEvent) {
    await this.mailerService.sendMail({
      to: payload.email,
      subject: 'Tu pedido ha sido enviado 🚚',
      template: 'order-shipped',
      context: {
        name: payload.name,
        orderId: payload.orderId.slice(0, 8),
      },
    });
  }

  @OnEvent('brand.sale')
  async handleBrandSale(payload: BrandSaleEvent) {
    await this.mailerService.sendMail({
      to: payload.email,
      subject: `¡Nueva venta para ${payload.brandName}! 💰`,
      template: 'new-sale',
      context: { ...payload },
    });
  }

  @OnEvent('product.stock_alert')
  async handleStockAlert(payload: StockAlertEvent) {
    const isOutOfStock = payload.stock === 0;

    const template = isOutOfStock ? 'out-of-stock' : 'low-stock';
    const subject = isOutOfStock
      ? `🚨 URGENTE: ${payload.productName} AGOTADO`
      : `⚠️ Stock bajo: ${payload.productName}`;

    console.log(
      `📧 Enviando alerta de stock (${payload.stock}) a ${payload.email}...`,
    );

    try {
      await this.mailerService.sendMail({
        to: payload.email,
        subject: subject,
        template: template,
        context: {
          brandName: payload.brandName,
          productName: payload.productName,
          stock: payload.stock,
        },
      });
    } catch (error) {
      console.error('❌ Error enviando alerta de stock:', error);
    }
  }
}
