import { Account } from '../../accounts/entities/accounts.entity';
import { Journey } from '../../journeys/entities/journey.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  BaseEntity,
} from 'typeorm';
import {
  AllStepTypeMetadata,
  StepType,
  StepTypeMetadata,
} from '../types/step.interface';

@Entity()
export class Step extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  public id!: string;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  public createdAt: Date;

  @JoinColumn()
  @ManyToOne(() => Account, (account) => account.id, { onDelete: 'CASCADE' })
  public owner: Account;

  @Column({ enum: StepType })
  public type: StepType;

  @JoinColumn()
  @ManyToOne(() => Journey, (journey) => journey.id, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  public journey: Journey;

  // Array of JSON-stringified StepCustomer Objects: see step-customer.interface.ts
  @Column('text', { nullable: false, array: true, default: [] })
  public customers: string[];

  @Column('jsonb', { nullable: true })
  public metadata: any;
}
