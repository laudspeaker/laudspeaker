import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  JoinColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Workspaces } from '../../workspaces/entities/workspaces.entity';
import { Account } from '../../accounts/entities/accounts.entity';
import { JourneyLocation } from './journey-location.entity';
import { Journey } from './journey.entity';
import { VisualLayout } from '../types/visual-layout.interface';

@Entity({ name: 'journey_versions' })
export class JourneyVersion {
  @PrimaryGeneratedColumn('increment', { type: 'bigint' })
  id: string;

  @Column({ type: 'uuid' })
  uuid: string;

  @Column()
  number: number;

  @JoinColumn({ name: 'workspace_id' })
  @ManyToOne(() => Workspaces, (workspace) => workspace.id, {
    onDelete: 'CASCADE',
  })
  workspace: Workspaces;

  @JoinColumn({ name: 'journey_id' })
  @ManyToOne(() => Journey, (journey) => journey.id, { onDelete: 'CASCADE' })
  public journey: string;

  @Column({ type: 'timestamp', default: () => 'NOW()' })
  created_at: Date;

  @Column({ type: 'timestamp', default: () => 'NOW()', onUpdate: 'NOW()' })
  updated_at: Date;

  @JoinColumn()
  @ManyToOne(() => Account, (account) => account.id, {
    nullable: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  created_by: Account;

  @JoinColumn()
  @ManyToOne(() => Account, (account) => account.id, {
    nullable: true,
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  updated_by: Account;

  @Column('jsonb', { default: { nodes: [], edges: [] } })
  layout: VisualLayout;

  @Column('uuid', { name: 'workspace_id', nullable: false })
  workspace_id: string;

  @Column('uuid', { name: 'journey_id', nullable: false })
  journey_id: string;
}
