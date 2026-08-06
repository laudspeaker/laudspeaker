import { Customer } from './customer.entity';
import { Workspaces } from '../../workspaces/entities/workspaces.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  JoinColumn,
  ManyToOne,
  Index,
} from 'typeorm';

@Entity({ name: 'customer_aliases' })
export class Customer {
  @PrimaryGeneratedColumn('increment', { type: 'bigserial' })
  id: string;

  @JoinColumn({ name: 'customer_id' })
  @ManyToOne(() => Customer, (customer) => customer.id, {
    onDelete: 'CASCADE',
  })
  customer: Customer;

  @Column({ type: 'uuid', unique: true, nullable: false })
  @Index()
  uuid: string;


  @CreateDateColumn({ type: 'timestamp', default: () => 'NOW()' })
  @Index()
  created_at: Date;


  @JoinColumn({ name: 'workspace_id' })
  @ManyToOne(() => Workspaces, (workspace) => workspace.id, {
    onDelete: 'CASCADE',
  })
  workspace: Workspaces;
}
