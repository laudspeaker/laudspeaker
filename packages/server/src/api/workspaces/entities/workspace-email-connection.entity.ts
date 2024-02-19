import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Workspaces } from './workspaces.entity';

@Entity()
@Unique(['workspaceId', 'emailProvider', 'sendingEmail', 'sendingName'])
export class WorkspaceEmailConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @JoinColumn()
  @ManyToOne(() => Workspaces, (workspace) => workspace.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  workspace: Workspaces;

  @Column()
  emailProvider: string;

  @Column()
  sendingEmail: string;

  @Column()
  sendingName: string;

  @Column()
  workspaceId: string;
}
