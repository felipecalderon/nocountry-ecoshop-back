import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { MaterialProduct } from './material-product.entity';

@Entity({ name: 'material_compositions' })
export class MaterialComposition {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true }) // Importante: Nombres únicos
  name: string; // Ej: 'Algodón Orgánico', 'Poliéster Reciclado'

  @Column({ default: false })
  isEcoFriendly: boolean;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  carbonFootprintPerKg: number; // Especificar la unidad ayuda al cálculo

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  waterUsagePerKg: number;

  // Relación inversa: Un material puede estar en muchos 'MaterialProduct'
  @OneToMany(() => MaterialProduct, (mp) => mp.materialComposition)
  materialProducts: MaterialProduct[];
}
