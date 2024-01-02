import { Workspaces } from '@/api/workspaces/entities/workspaces.entity';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Account } from '../../accounts/entities/accounts.entity';
import { Step } from './step.entity';

@Entity()
export class Requeue extends BaseEntity {
  @PrimaryColumn('varchar')
  public customerId: string;

  @JoinColumn()
  @ManyToOne(() => Workspaces, (workspace) => workspace.id, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  @PrimaryColumn('uuid', { name: 'workspaceId' })
  workspace: Workspaces;

  @PrimaryColumn('uuid', { name: 'stepId' })
  @JoinColumn({ name: 'stepId' })
  @ManyToOne(() => Step, (step) => step.id, {
    onDelete: 'CASCADE',
    nullable: false,
  })
  public step: Step;

  @Column('timestamptz', { nullable: false })
  public requeueAt: Date;
}
