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
import { Workspaces } from '@/api/workspaces/entities/workspaces.entity';
import { Account } from '@/api/accounts/entities/accounts.entity';

@Entity()
export class Journey {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name: string;

  @JoinColumn()
  @ManyToOne(() => Workspaces, (workspace) => workspace.id, {
    onDelete: 'CASCADE',
  })
  workspace: Workspaces;

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

  @JoinColumn()
  @ManyToOne(() => Account, (account) => account.id, {
    nullable: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  latestChanger?: Account;

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

  // How many times reenrollment has occurred
  @Column('bigint', { default: 0 })
  enrollment_count: number;

  // This is actually a timestamp using ECMAScript's native Date object; will yield
  // the same number across any timezone
  @Column('bigint', { nullable: true })
  last_enrollment_timestamp?: number;
}
