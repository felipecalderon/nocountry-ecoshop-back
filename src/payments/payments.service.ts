import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { OrdersService } from 'src/orders/orders.service';
import { User } from 'src/users/entities/user.entity';
import Stripe from 'stripe';

@Injectable()
export class PaymentsService {
  private stripe: Stripe;
  constructor(
    private readonly configService: ConfigService,
    private readonly ordersService: OrdersService,
  ) {
    const stripeSecretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new NotFoundException(
        'Stripe secret key not found in configuration',
      );
    }
    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2025-11-17.clover',
    });
  }

  async createCheckoutSession(orderId: string, user: User) {
    const orders = await this.ordersService.findAll(user);
    const order = orders.find((o) => o.id === orderId);

    if (!order) {
      throw new NotFoundException('Orden no encontrada.');
    }

    const session = await this.stripe.checkout.sessions.create({
      metadata: {
        orderId: order.id,
      },
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `Pedido EcoShop #${order.id.slice(0, 5)}`,
              description: 'Compra sostenible en EcoShop',
            },
            unit_amount: Math.round(Number(order.totalPrice) * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: this.configService.get<string>('STRIPE_SUCCESS_URL'),
      cancel_url: this.configService.get<string>('STRIPE_CANCEL_URL'),
      customer_email: user.email,
    });

    return {
      url: session.url,
    };
  }

  async constructEvent(payload: any, signature: string, secret: string) {
    try {
      return this.stripe.webhooks.constructEvent(payload, signature, secret);
    } catch (err) {
      throw new BadRequestException(`Webhook Error: ${err.message}`);
    }
  }

  async handleWebhook(event: Stripe.Event) {
    switch (event.type) {
      case 'checkout.session.completed':
        const session = event.data.object as Stripe.Checkout.Session;

        const orderId = session.metadata?.orderId;

        console.log(`Pago recibido para Orden: ${orderId}`);

        if (orderId) {
          await this.ordersService.markAsPaid(orderId);
        }
        break;

      case 'checkout.session.expired':
        console.log('La sesión de pago expiró');
        break;

      default:
        console.log(`Evento no manejado: ${event.type}`);
    }
  }
}
