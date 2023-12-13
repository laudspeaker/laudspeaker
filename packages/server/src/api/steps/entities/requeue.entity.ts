import {
  BaseEntity,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Account } from '../../accounts/entities/accounts.entity';
import { Step } from './step.entity';

@Entity()
export class Requeue extends BaseEntity {
  @PrimaryColumn('varchar')
  public customerId: string;

  @JoinColumn({ name: 'ownerId' })
  @ManyToOne(() => Account, (account) => account.id, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @PrimaryColumn('uuid', { name: 'ownerId' })
  public owner: Account;

  @PrimaryColumn('uuid', { name: 'stepId' })
  @JoinColumn({ name: 'stepId' })
  @ManyToOne(() => Step, (step) => step.id, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  public step: Step;
}

