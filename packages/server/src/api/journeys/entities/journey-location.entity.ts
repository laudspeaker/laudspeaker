import {
  Entity,
  Column,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Step } from '../../steps/entities/step.entity';
import { Journey } from './journey.entity';
import { Workspaces } from '../../workspaces/entities/workspaces.entity';
import { Customer } from '../../customers/entities/customer.entity';

@Entity()
export class JourneyLocation {
  @PrimaryColumn({ name: 'journey_id' })
  @ManyToOne(() => Journey, (journey) => journey.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'journey_id' })
  public journey!: string;

  @PrimaryColumn({ name: 'customer_id' })
  @ManyToOne(() => Customer, (customer) => customer.id, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  public customer!: Customer;

  @JoinColumn({ name: 'step_id' })
  @ManyToOne(() => Step, (step) => step.id, { onDelete: 'CASCADE' })
  step!: Step;

  @JoinColumn({ name: 'workspace_id' })
  @ManyToOne(() => Workspaces, (workspace) => workspace.id, {
    onDelete: 'CASCADE',
  })
  workspace!: Workspaces;

  // This is actually a timestamp using ECMAScript's native Date object; will yield
  // the same number across any timezone
  @Column({ type: 'bigint', nullable: false })
  stepEntry!: number;

  @Column({
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  stepEntryAt!: Date;

  // This is actually a timestamp using ECMAScript's native Date object; will yield
  // the same number across any timezone
  @Column({ type: 'bigint', nullable: false, default: 0 })
  journeyEntry!: number;

  @Column({
    type: 'timestamp',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  journeyEntryAt!: Date;

  // This is actually a timestamp using ECMAScript's native Date object; will yield
  // the same number across any timezone
  @Column({
    type: 'bigint',
    nullable: true,
  })
  moveStarted?: number | null;

  // This column is used to keep track of unique customers who've received a message
  // for a journey. Allows for rate limiting by customers receiving messages.
  @Column({
    type: 'boolean',
    nullable: true,
  })
  messageSent?: boolean | null;

  // use these fields in queries to improve perf.
  // prevents joining related tables while querying current
  // table
  @Column('uuid', { name: 'journey_id', nullable: false })
  journey_id: string;

  @Column('uuid', { name: 'step_id', nullable: false })
  step_id: string;

  @Column('bigint', { name: 'customer_id', nullable: false })
  customer_id: string;

  @Column('uuid', { name: 'workspace_id', nullable: false })
  workspace_id: string;
}
