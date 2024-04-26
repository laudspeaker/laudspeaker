import { Account } from '../../accounts/entities/accounts.entity';
import {
  BaseEntity,
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Database } from './database.entity';
import { Workspace } from '@/api/workspaces/entities/workspace.entity';

export enum IntegrationType {
  DATABASE = 'database',
}

export enum IntegrationStatus {
  ACTIVE = 'active',
  PAUSED = 'paused',
  FAILED = 'failed',
}

@Entity()
export class Integration extends BaseEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @JoinColumn()
  @ManyToOne(() => Workspace, (workspace) => workspace.id, {
    onDelete: 'CASCADE',
  })
  workspace: Workspace;

  @Column()
  name: string;

  @Column({ nullable: true })
  description?: string;

  @Column({ enum: IntegrationType })
  type: IntegrationType;

  @Column({ enum: IntegrationStatus, default: IntegrationStatus.ACTIVE })
  status: IntegrationStatus;

  @Column({ nullable: true })
  errorMessage?: string;

  @JoinColumn()
  @OneToOne(() => Database, (database) => database.id, { onDelete: 'CASCADE' })
  database: Database;
}
