import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { WalletService } from '../services/wallet.service';
import { PointsCalculatorService } from '../services/points-calculator.service';
import { OrderPaidWalletEvent } from './order-paid.event';

@Injectable()
export class OrderPaidListener {
  private readonly logger = new Logger(OrderPaidListener.name);

  constructor(
    private readonly walletService: WalletService,
    private readonly pointsCalculator: PointsCalculatorService,
  ) {}

  @OnEvent('order.paid', { async: true })
  async handleOrderPaidEvent(event: OrderPaidWalletEvent) {
    const { userId, totalAmount, totalCo2Saved, orderId } = event;

    this.logger.log(
      `Procesando puntos para la orden ${orderId} del usuario ${userId}`,
    );

    try {
      const wallet = await this.walletService.getBalance(userId);

      const calculation = this.pointsCalculator.calculatePoints(
        totalAmount,
        totalCo2Saved,
        wallet.level,
      );

      if (calculation.totalPoints > 0) {
        await this.walletService.addPoints(
          userId,
          calculation.totalPoints,
          `Premio por Orden #${orderId.slice(0, 8)}`,
          {
            orderId,
            co2Saved: totalCo2Saved,
            breakdown: calculation.breakdown,
          },
        );

        this.logger.log(
          `+${calculation.totalPoints} puntos acreditados al usuario ${userId}`,
        );
      }
    } catch (error) {
      this.logger.error(
        `Error procesando puntos para la orden ${orderId}`,
        error.stack,
      );
    }
  }
}
