import { Account } from '../../accounts/entities/accounts.entity';
import {
  BaseEntity,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
} from 'typeorm';
import { Segment } from './segment.entity';
import { Workspace } from '@/api/workspaces/entities/workspace.entity';

@Entity()
export class SegmentCustomers extends BaseEntity {
  @PrimaryColumn({ name: 'segmentId' })
  @JoinColumn({ name: 'segmentId' })
  @ManyToOne(() => Segment, (segment) => segment.id, { onDelete: 'CASCADE' })
  public segment: string;

  @PrimaryColumn()
  public customerId: string;

  @JoinColumn()
  @ManyToOne(() => Workspace, (workspace) => workspace.id, {
    onDelete: 'CASCADE',
  })
  workspace: Workspace;
}
