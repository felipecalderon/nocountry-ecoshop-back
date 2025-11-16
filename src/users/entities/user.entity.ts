import { Brand } from '../../brands/entities/brand.entity';
import { Order } from '../../orders/entities/order.entity';
import { Address } from './address.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
  DeleteDateColumn,
} from 'typeorm';

export enum UserRole {
  CUSTOMER = 'customer',
  BRAND_ADMIN = 'brand_admin',
  ADMIN = 'admin',
}

@Entity({ name: 'users' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ comment: 'Contraseña hasheada con bcrypt' })
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CUSTOMER,
  })
  role: UserRole;

  @Column({ nullable: true })
  firstName: string;

  @Column({ nullable: true })
  lastName: string;

  @Column({ nullable: true, comment: 'DNI, CUIT, RUT, etc.' })
  nationalId: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ type: 'date', nullable: true })
  birthDate: Date;

  @Column({ default: false })
  emailVerified: boolean;

  @Column({ default: false })
  isBanned: boolean;

  @Column({
    type: 'jsonb',
    nullable: true,
    comment: 'Almacena IDs de cliente de pasarelas (Stripe, MP, etc.)',
  })
  paymentCustomerIds: Record<string, any>;
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @DeleteDateColumn()
  deletedAt: Date;

  @OneToOne(() => Brand, (brand) => brand.owner)
  brand: Brand;

  @OneToMany(() => Order, (order) => order.user)
  orders: Order[];

  @OneToMany(() => Address, (address) => address.user, { cascade: true })
  addresses: Address[];
}
