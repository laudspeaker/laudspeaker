import { Account } from '@/api/accounts/entities/accounts.entity';
import { Customer } from '@/api/customers/schemas/customer.schema';
import { Journey } from '@/api/journeys/entities/journey.entity';
import {
  BaseEntity,
  Column,
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export interface DevModeState {
  customerIn: {
    nodeId: string;
    stepId: string;
  };
  customerData: Customer;
  customerStory: Record<string,Customer>;
}

@Entity()
export class DevMode extends BaseEntity {
  @PrimaryColumn('uuid')
  @JoinColumn({ name: 'ownerId' })
  @ManyToOne(() => Account, (account) => account.id, { onDelete: 'CASCADE' })
  public ownerId: string;

  @PrimaryColumn('uuid')
  @JoinColumn({ name: 'journeyId' })
  @ManyToOne(() => Journey, (journey) => journey.id, { onDelete: 'CASCADE' })
  public journeyId: string;

  @Column({ type: 'jsonb' })
  public devModeState!: DevModeState;
}

