import { Module } from '@nestjs/common';
import { WalletService } from './services/wallet.service';
import { WalletController } from './controllers/wallet.controller';
import { PointsCalculatorService } from './services/points-calculator.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './entities/wallet.entity';
import { Reward } from './entities/reward.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';
import { OrderPaidListener } from './listeners/order-paid.listener';
import { Coupon } from './entities/coupon.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Wallet, Reward, WalletTransaction, Coupon]),
  ],
  controllers: [WalletController],
  providers: [WalletService, PointsCalculatorService, OrderPaidListener],
})
export class WalletModule {}
