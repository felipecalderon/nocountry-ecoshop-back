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
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { NotificationsModule } from './notifications/notifications.module';
import { AdminModule } from './admin/admin.module';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { MaterialCompositionModule } from './material-composition/material-composition.module';

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
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    NotificationsModule,
    AdminModule,
    MaterialCompositionModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}
