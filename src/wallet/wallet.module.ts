import { Module } from '@nestjs/common';
import { WalletService } from './services/wallet.service';
import { WalletController } from './controllers/wallet.controller';
import { PointsCalculatorService } from './services/points-calculator.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Wallet } from './entities/wallet.entity';
import { Reward } from './entities/reward.entity';
import { WalletTransaction } from './entities/wallet-transaction.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Wallet, Reward, WalletTransaction])],
  controllers: [WalletController],
  providers: [WalletService, PointsCalculatorService],
})
export class WalletModule {}
