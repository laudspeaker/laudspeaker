import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  OneToOne,
  PrimaryColumn,
} from 'typeorm';
import { Segment } from './segment.entity';
import { Workspaces } from '../../workspaces/entities/workspaces.entity';
import { Customer } from '../../customers/entities/customer.entity';

@Entity()
export class SegmentCustomers extends BaseEntity {
  @PrimaryColumn({ name: 'segment_id' })
  @OneToOne(() => Segment, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'segment_id' })
  segment: Segment

  @PrimaryColumn({ name: 'customer_id' })
  @OneToOne(() => Customer, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer

  @OneToOne(() => Workspaces, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'workspace_id' })
  workspace: Workspaces;

  // This is actually a timestamp using ECMAScript's native Date object; will yield
  // the same number across any timezone
  @Column({ type: 'bigint', nullable: true, default: 0 })
  segmentEntry: number;

  @Column('uuid', { name: 'segment_id', nullable: false })
  segment_id: string;

  @Column('bigint', { name: 'customer_id', nullable: false })
  customer_id: string;

  @Column('uuid', { name: 'workspace_id', nullable: false })
  workspace_id: string;
}
