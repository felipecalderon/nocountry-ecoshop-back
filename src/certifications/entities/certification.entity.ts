import { Product } from '../../products/entities/product.entity';
import { Entity, PrimaryGeneratedColumn, Column, ManyToMany } from 'typeorm';

@Entity({ name: 'certifications' })
export class Certification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string; // Ej: 'Fair Trade', 'Carbon Neutral'

  @Column({ comment: 'URL del icono/sello' })
  badgeUrl: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @ManyToMany(() => Product, (product) => product.certifications)
  products: Product[];
}
