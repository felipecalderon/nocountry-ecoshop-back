import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { User } from 'src/users/entities/user.entity';
import { Address } from 'src/addresses/entities/address.entity';
import { Product } from 'src/products/entities/product.entity';
import { Coupon } from 'src/wallet/entities/coupon.entity';
import { StockAlertEvent } from 'src/notifications/notifications.service';
import { CreateOrderDto } from '../dto/create-order.dto';
import { OrderItem } from '../entities/order-item.entity';

@Injectable()
export class OrdersHelper {
  private readonly logger = new Logger(OrdersHelper.name);

  async validateAddress(
    addressId: string,
    userId: string,
    manager: EntityManager,
  ): Promise<Address> {
    const address = await manager.findOne(Address, {
      where: { id: addressId, user: { id: userId } },
    });

    if (!address) {
      throw new NotFoundException(
        'Dirección de envío no encontrada o no pertenece al usuario.',
      );
    }
    return address;
  }

  async processOrderItems(
    itemsDto: CreateOrderDto['items'],
    manager: EntityManager,
  ): Promise<{
    orderItems: OrderItem[];
    totalPrice: number;
    totalCarbonFootprint: number;
    stockAlerts: StockAlertEvent[];
  }> {
    const orderItems: OrderItem[] = [];
    const stockAlerts: StockAlertEvent[] = [];
    let totalPrice = 0;
    let totalCarbonFootprint = 0;

    for (const itemDto of itemsDto) {
      const product = await manager.findOne(Product, {
        where: { id: itemDto.productId },
        relations: ['environmentalImpact', 'brand', 'brand.owner'],
      });

      if (!product) {
        throw new NotFoundException(
          `Producto con ID ${itemDto.productId} no encontrado.`,
        );
      }

      if (product.stock < itemDto.quantity) {
        throw new BadRequestException(
          `Stock insuficiente para el producto: ${product.name} (Disponible: ${product.stock})`,
        );
      }

      const currentPrice = Number(product.price);
      const carbonImpact = Number(
        product.environmentalImpact?.carbonFootprint || 0,
      );

      totalPrice += currentPrice * itemDto.quantity;
      totalCarbonFootprint += carbonImpact * itemDto.quantity;

      product.stock -= itemDto.quantity;
      await manager.save(product);

      if (product.stock <= 5) {
        stockAlerts.push({
          email: product.brand.owner.email,
          brandName: product.brand.name,
          productName: product.name,
          stock: product.stock,
        });
      }

      const orderItem = new OrderItem();
      orderItem.product = product;
      orderItem.quantity = itemDto.quantity;
      orderItem.priceAtPurchase = currentPrice;
      orderItem.carbonFootprintSnapshot = carbonImpact;

      orderItems.push(orderItem);
    }

    return { orderItems, totalPrice, totalCarbonFootprint, stockAlerts };
  }

  async validateAndApplyCoupon(
    couponCode: string,
    user: User,
    currentTotal: number,
    manager: EntityManager,
  ): Promise<{ discountAmount: number }> {
    const coupon = await manager.findOne(Coupon, {
      where: { code: couponCode },
      relations: ['user'],
    });

    if (!coupon) {
      throw new NotFoundException('El código de descuento no es válido.');
    }

    if (coupon.isUsed) {
      throw new BadRequestException('Este cupón ya ha sido utilizado.');
    }

    if (coupon.user.id !== user.id) {
      throw new BadRequestException('Este cupón no pertenece a tu usuario.');
    }

    if (coupon.expiresAt && new Date() > coupon.expiresAt) {
      throw new BadRequestException('El cupón ha expirado.');
    }

    const discountAmount = (currentTotal * coupon.discountPercentage) / 100;

    coupon.isUsed = true;
    await manager.save(coupon);

    return { discountAmount };
  }

  calculateEcoLevel(co2Saved: number): { level: string; nextGoal: number } {
    if (co2Saved >= 200) return { level: 'Héroe Climático', nextGoal: 1000 };
    if (co2Saved >= 50) return { level: 'Guardián del Bosque', nextGoal: 200 };
    if (co2Saved >= 10) return { level: 'Brote Consciente', nextGoal: 50 };
    return { level: 'Semilla', nextGoal: 10 };
  }

  handleDBExceptions(error: any): never {
    this.logger.error(`Database Error: ${error.message}`, error.stack);

    if (
      error instanceof BadRequestException ||
      error instanceof NotFoundException
    ) {
      throw error;
    }

    throw new InternalServerErrorException(
      'Error procesando la orden. Intente nuevamente.',
    );
  }
}
