import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { Product } from './entities/product.entity';
import { EnvironmentalImpact } from './entities/environmental-impact.entity';
import { MaterialProduct } from './entities/material-product.entity';
import { Brand } from 'src/brands/entities/brand.entity';
import { Certification } from 'src/certifications/entities/certification.entity';
import { BrandsModule } from 'src/brands/brands.module';
import { MaterialCompositionModule } from 'src/material-composition/material-composition.module';
import { CertificationsModule } from 'src/certifications/certifications.module';
import { ProductsHelper } from './helpers/products.helper';
import { FilesService } from 'src/files/files.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      EnvironmentalImpact,
      MaterialProduct,
      Brand,
      Certification,
      Brand,
    ]),
    BrandsModule,
    MaterialCompositionModule,
    CertificationsModule,
  ],
  controllers: [ProductsController],
  providers: [ProductsService, ProductsHelper, FilesService],
  exports: [ProductsService, ProductsHelper],
})
export class ProductsModule {}
