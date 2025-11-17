import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { BrandsModule } from './brands/brands.module';
import { OrdersModule } from './orders/orders.module';
import { CertificationsModule } from './certifications/certifications.module';
import { DataBaseModule } from './database/database.module';

@Module({
  imports: [
    DataBaseModule,
    UsersModule,
    ProductsModule,
    BrandsModule,
    OrdersModule,
    CertificationsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
