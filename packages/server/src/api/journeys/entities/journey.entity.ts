import { Account } from '../../accounts/entities/accounts.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
} from 'typeorm';
import { VisualLayout } from '../types/visual-layout.interface';
import {
  JourneyEntrySettings,
  JourneySettings,
} from '../types/additional-journey-settings.interface';

@Entity()
export class Journey {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name: string;

  @JoinColumn()
  @ManyToOne(() => Account, (account) => account.id, { onDelete: 'CASCADE' })
  owner: Account;

  @Column('boolean', { default: false })
  isActive: boolean;

  @Column('boolean', { default: false })
  isPaused: boolean;

  @Column('boolean', { default: false })
  isStopped: boolean;

  @Column('boolean', { default: false })
  isDeleted: boolean;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', nullable: true })
  startedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  stoppedAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  latestPause?: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  latestSave?: Date;

  // {"nodes":[...list of nodes], "edges": [...list of edges]}
  @Column('jsonb', { default: { nodes: [], edges: [] } })
  visualLayout: VisualLayout;

  @Column({ default: true })
  isDynamic: boolean;

  @Column('jsonb', { default: { type: 'allCustomers' } })
  inclusionCriteria: any;

  // TODO: might need to add default values for those two columns
  @Column('jsonb', { nullable: true })
  journeyEntrySettings?: JourneyEntrySettings;

  @Column('jsonb', { nullable: true })
  journeySettings?: JourneySettings;

  // Indicates if a Journey is an original or a recurrence.
  @Column('boolean', { nullable: false, default: false })
  isRecurrence: boolean;

  // If this is a recurrence Journey, this field indicates the
  // time that this journey was started/recurred
  @Column('bigint', { nullable: false, default: -1 })
  recurrenceTimestamp: number;

  // If this is an original Journey, how many times has it has recurred.
  // This will remain 0 until the first time the customers are enrolled.
  // If journey type is 'Enter users as soon as this journey is published'
  // this field can be ignored.
  @Column('int', { nullable: false, default: 0 })
  recurrenceCount: number;

  // Boolean indicating whether or not customers have been enrolled in this journey yet;
  // if journey enrollment type is 'Enter users as soon as this journey is published'
  // or 'Enter users in their local time zone' this field can be ignored
  @Column('boolean', { nullable: false, default: false })
  customersEnrolled: boolean;

  // Journey ID that this journey was copied from if its a recurrence
  @Column('varchar', { nullable: true })
  recurrenceId: string;
}
