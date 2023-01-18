import { Account } from '@/api/accounts/entities/accounts.entity';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Database } from './database.entity';

export enum IntegrationType {
  DATABASE = 'database',
}

@Entity()
export class Integration extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @JoinColumn()
  @ManyToOne(() => Account, (account) => account.id, { onDelete: 'CASCADE' })
  owner: Account;

  @Column()
  name: string;

  @Column()
  description: string;

  @Column({ enum: IntegrationType })
  type: IntegrationType;

  @JoinColumn()
  @OneToOne(() => Database, (database) => database.id, { onDelete: 'CASCADE' })
  database: Database;
}
