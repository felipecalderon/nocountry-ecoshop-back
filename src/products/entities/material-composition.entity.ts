import { Product } from './product.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity({ name: 'material_compositions' })
export class MaterialComposition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  material: string;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
  })
  percentage: number;

  @Column({ default: false })
  isEcoFriendly: boolean;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  carbonFootprint: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
  })
  waterUsage: number;

  @ManyToOne(() => Product, (product) => product.materialComposition)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
