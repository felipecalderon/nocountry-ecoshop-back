import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Product } from './entities/product.entity';
import { EnvironmentalImpact } from './entities/environmental-impact.entity';
import { MaterialComposition } from './entities/material-composition.entity';
import { MaterialProduct } from './entities/material-product.entity';
import { Brand } from 'src/brands/entities/brand.entity';
import { Certification } from 'src/certifications/entities/certification.entity';

import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      EnvironmentalImpact,
      MaterialProduct,
      MaterialComposition,
      Brand,
      Certification,
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
