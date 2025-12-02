import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Wallet } from '../entities/wallet.entity';
import {
  TransactionType,
  WalletTransaction,
} from '../entities/wallet-transaction.entity';
import { Reward } from '../entities/reward.entity';
import { RedeemPointsDto } from '../dto/redeem-points.dto';
import { CreateRewardDto } from '../dto/create-reward.dto';

@Injectable()
export class WalletService {
  constructor(
    @InjectRepository(Wallet)
    private readonly walletRepository: Repository<Wallet>,
    @InjectRepository(WalletTransaction)
    private readonly walletTransactionRepository: Repository<WalletTransaction>,
    @InjectRepository(Reward)
    private readonly rewardRepository: Repository<Reward>,
    private readonly dataSource: DataSource,
  ) {}

  async getBalance(userId: string): Promise<Wallet> {
    let wallet = await this.walletRepository.findOne({ where: { userId } });

    if (!wallet) {
      wallet = this.walletRepository.create({
        userId,
        balance: 0,
        level: 'Semilla',
      });
      await this.walletRepository.save(wallet);
    }

    return wallet;
  }

  async getHistory(userId: string) {
    const wallet = await this.getBalance(userId);

    return this.walletTransactionRepository.find({
      where: { walletId: wallet.id },
      order: { createdAt: 'DESC' },
      take: 20,
    });
  }

  async addPoints(
    userId: string,
    amount: number,
    description: string,
    metadata?: any,
  ) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');

    await this.dataSource.transaction(async (manager) => {
      let wallet = await manager.findOne(Wallet, { where: { userId } });
      if (!wallet) {
        wallet = manager.create(Wallet, { userId, balance: 0 });
        await manager.save(wallet);
      }

      wallet.balance += amount;
      await manager.save(wallet);

      const tx = manager.create(WalletTransaction, {
        wallet,
        amount,
        type: TransactionType.EARN_PURCHASE,
        description,
        metadata,
      });
      await manager.save(tx);
    });

    return { success: true, pointsAdded: amount };
  }

  async redeemPoints(userId: string, redeemDto: RedeemPointsDto) {
    const { rewardId, amount } = redeemDto;

    return await this.dataSource.transaction(async (manager) => {
      const reward = await manager.findOne(Reward, { where: { id: rewardId } });
      if (!reward) throw new NotFoundException('Reward not found');
      if (!reward.isActive)
        throw new BadRequestException('Reward is not active');

      const cost = reward.costInPoints;
      if (amount < cost) {
        throw new BadRequestException(`This reward costs ${cost} points`);
      }

      const wallet = await manager.findOne(Wallet, { where: { userId } });
      if (!wallet) throw new NotFoundException('Wallet not found for user.');

      if (wallet.balance < amount) {
        throw new UnprocessableEntityException(
          `Insufficient funds. Balance: ${wallet.balance}, Required: ${amount}`,
        );
      }

      if (reward.stock !== null) {
        if (reward.stock <= 0)
          throw new UnprocessableEntityException('Reward out of stock');
        reward.stock -= 1;
        await manager.save(reward);
      }

      wallet.balance -= amount;

      await manager.save(wallet);

      const tx = manager.create(WalletTransaction, {
        wallet,
        amount: -amount,
        type: TransactionType.REDEEM_REWARD,
        referenceId: rewardId,
        description: `Canje: ${reward.name}`,
        metadata: { rewardId: reward.id, rewardName: reward.name },
      });
      await manager.save(tx);

      return {
        success: true,
        transactionId: tx.id,
        spentPoints: amount,
        newBalance: wallet.balance,
        rewardName: reward.name,
      };
    });
  }

  async createReward(createRewardDto: CreateRewardDto) {
    const reward = this.rewardRepository.create(createRewardDto);
    return this.rewardRepository.save(reward);
  }

  async findAllRewards() {
    return this.rewardRepository.find({ where: { isActive: true } });
  }
}
