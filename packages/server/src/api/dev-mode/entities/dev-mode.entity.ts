import { Account } from '@/api/accounts/entities/accounts.entity';
import { Journey } from '@/api/journeys/entities/journey.entity';
import {
  BaseEntity,
  Column,
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

@Entity()
export class DevMode extends BaseEntity {
  @PrimaryColumn('uuid')
  @ManyToOne(() => Account, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'ownerId' })
  public ownerId!: Account;

  @PrimaryColumn('uuid')
  @ManyToOne(() => Journey, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'journeyId' })
  public journeyId!: Journey;

  @Column({ type: 'jsonb' })
  public devModeState!: JSON;
}

