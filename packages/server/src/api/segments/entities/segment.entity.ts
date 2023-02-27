import { Account } from '@/api/accounts/entities/accounts.entity';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class Segment extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id: string;

  @JoinColumn()
  @ManyToOne(() => Account, (account) => account.id, { onDelete: 'CASCADE' })
  public user: Account;

  @Column()
  public name: string;
}
