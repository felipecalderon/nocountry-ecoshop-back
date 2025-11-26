import {
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Product } from './product.entity';

export enum EcoBadgeLevel {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  NEUTRAL = 'NEUTRAL',
}

@Entity({ name: 'environmental_impact' })
export class EnvironmentalImpact {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    comment: 'Huella de carbono total calculada en kg CO2e',
  })
  carbonFootprint: number;

  @Column({
    type: 'decimal',
    precision: 10,
    scale: 2,
    default: 0,
    comment: 'Uso de agua total calculado en Litros',
  })
  waterUsage: number;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    default: 0,
  })
  recycledContent: number;

  @Column({
    type: 'enum',
    enum: EcoBadgeLevel,
    default: EcoBadgeLevel.MEDIUM,
  })
  ecoBadgeLevel: EcoBadgeLevel;

  @OneToOne(() => Product, (product) => product.environmentalImpact)
  @JoinColumn({ name: 'product_id' })
  product: Product;
}
