import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Workspace } from './workspace.entity';

@Entity()
export class WorkspaceTwilioConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @JoinColumn()
  @ManyToOne(() => Workspace, (workspace) => workspace.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  workspace: Workspace;

  @Column()
  name: string;

  @Column()
  sid: string;

  @Column()
  token: string;

  @Column()
  from: string;

  @Column()
  workspaceId: string;
}
