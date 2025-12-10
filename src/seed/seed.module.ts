import { Module } from '@nestjs/common';
import { SeedController } from './seed.controller';
import { ProductsModule } from 'src/products/products.module';
import { BrandsModule } from 'src/brands/brands.module';
import { UsersModule } from 'src/users/users.module';
import { WalletModule } from 'src/wallet/wallet.module';
import { MaterialCompositionModule } from 'src/material-composition/material-composition.module';
import { CertificationsModule } from 'src/certifications/certifications.module';
import { SeedService } from './seed.service';
import { ProductsService } from 'src/products/products.service';
import { WalletService } from 'src/wallet/services/wallet.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from 'src/products/entities/product.entity';
import { Wallet } from 'src/wallet/entities/wallet.entity';
import { WalletTransaction } from 'src/wallet/entities/wallet-transaction.entity';
import { Reward } from 'src/wallet/entities/reward.entity';
import { Coupon } from 'src/wallet/entities/coupon.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      Wallet,
      WalletTransaction,
      Reward,
      Coupon,
    ]),
    ProductsModule,
    BrandsModule,
    UsersModule,
    WalletModule,
    MaterialCompositionModule,
    CertificationsModule,
  ],
  controllers: [SeedController],
  providers: [SeedService, ProductsService, WalletService],
})
export class SeedModule {}
