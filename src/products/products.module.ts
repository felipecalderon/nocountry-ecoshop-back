import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './entities/product.entity';
import { EnvironmentalImpact } from './entities/environmental-impact.entity';
import { MaterialComposition } from '../material-composition/entities/material-composition.entity';
import { ProductsService } from './products.service';
import { ProductsController } from './products.controller';
import { MaterialProduct } from './entities/material-product.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Product,
      EnvironmentalImpact,
      MaterialProduct,
      MaterialComposition,
    ]),
  ],
  controllers: [ProductsController],
  providers: [ProductsService],
})
export class ProductsModule {}
