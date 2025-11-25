import { EnvironmentalImpact } from './environmental-impact.entity';
import { MaterialComposition } from './material-composition.entity';
import { Brand } from '../../brands/entities/brand.entity';
import { Certification } from '../../certifications/entities/certification.entity';
import { OrderItem } from '../../orders/entities/order-item.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  ManyToOne,
  ManyToMany,
  JoinTable,
  JoinColumn,
  DeleteDateColumn,
} from 'typeorm';
import { MaterialProduct } from './material-product.entity';

export enum RecyclabilityStatus {
  FULLY_RECYCLABLE = 'FULLY_RECYCLABLE',
  PARTIALLY_RECYCLABLE = 'PARTIALLY_RECYCLABLE',
  NON_RECYCLABLE = 'NON_RECYCLABLE',
}

@Entity({ name: 'products' })
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  slug: string;

  @Column()
  name: string;

  @Column({ comment: 'URL de la imagen principal' })
  image: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ unique: true })
  sku: string;

  @Column({ nullable: true })
  originCountry: string;

  @Column({
    type: 'enum',
    enum: RecyclabilityStatus,
    default: RecyclabilityStatus.NON_RECYCLABLE,
  })
  recyclabilityStatus: RecyclabilityStatus;

  @Column({ nullable: true })
  imageAltText: string;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToOne(() => EnvironmentalImpact, (impact) => impact.product, {
    cascade: true,
  })
  enviromentalImpact: EnvironmentalImpact;

  @OneToMany(() => MaterialProduct, (material) => material.product, {
    cascade: true,
  })
  materials: MaterialProduct[];

  @ManyToOne(() => Brand, (brand) => brand.products)
  @JoinColumn({ name: 'brand_id' })
  brand: Brand;

  @ManyToMany(() => Certification, { cascade: true })
  @JoinTable({
    name: 'product_certifications',
    joinColumn: { name: 'product_id', referencedColumnName: 'id' },
    inverseJoinColumn: { name: 'certification_id', referencedColumnName: 'id' },
  })
  certifications: Certification[];

  @OneToMany(() => OrderItem, (item) => item.product)
  orderItems: OrderItem[];
}
