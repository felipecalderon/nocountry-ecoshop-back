import { Module } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { BrandsModule } from './brands/brands.module';
import { OrdersModule } from './orders/orders.module';
import { CertificationsModule } from './certifications/certifications.module';
import { DataBaseModule } from './database/database.module';
import { AuthModule } from './auth/auth.module';
import { AddressesModule } from './addresses/addresses.module';
import { PaymentsModule } from './payments/payments.module';
import { FilesModule } from './files/files.module';

@Module({
  imports: [
    DataBaseModule,
    UsersModule,
    ProductsModule,
    BrandsModule,
    OrdersModule,
    CertificationsModule,
    AuthModule,
    AddressesModule,
    PaymentsModule,
    FilesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
