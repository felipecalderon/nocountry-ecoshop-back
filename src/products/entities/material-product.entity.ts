import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';
import { MaterialComposition } from '../../material-composition/entities/material-composition.entity';
import { Exclude } from 'class-transformer';

@Entity({ name: 'material_products' })
export class MaterialProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  percentage: number;

  @ManyToOne(
    () => MaterialComposition,
    (composition) => composition.materialProducts,
  )
  @JoinColumn({ name: 'composition_id' })
  materialComposition: MaterialComposition;

  @ManyToOne(() => Product, (product) => product.materials)
  @Exclude()
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
