import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum RewardType {
  DONATION = 'DONATION',
  COUPON = 'COUPON',
  PRODUCT = 'PRODUCT',
}

@Entity('rewards')
export class Reward {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'text', nullable: true })
  description: string;

  @Column({ type: 'int' })
  costInPoints: number;

  @Column({ type: 'varchar', nullable: true })
  imageUrl: string;

  @Column({ type: 'int', nullable: true })
  stock: number;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  // Tipo de recompensa para lógica de backend
  // DONATION = Ejecuta lógica de donación
  // COUPON = Genera código de descuento
  @Column({
    type: 'enum',
    enum: RewardType,
    default: RewardType.DONATION,
  })
  type: RewardType;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
