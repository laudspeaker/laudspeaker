import { Account } from '../../accounts/entities/accounts.entity';
import {
  BaseEntity,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Segment } from './segment.entity';
import { Workspaces } from '@/api/workspaces/entities/workspaces.entity';

@Entity()
export class SegmentCustomers extends BaseEntity {
  @PrimaryColumn({ name: 'segmentId' })
  @JoinColumn({ name: 'segmentId' })
  @ManyToOne(() => Segment, (segment) => segment.id, { onDelete: 'CASCADE' })
  public segment: string;

  @PrimaryColumn()
  public customerId: string;

  @JoinColumn()
  @ManyToOne(() => Workspaces, (workspace) => workspace.id, {
    onDelete: 'CASCADE',
  })
  workspace: Workspaces;
}
