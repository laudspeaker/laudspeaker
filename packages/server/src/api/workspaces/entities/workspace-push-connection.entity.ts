import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Workspace } from './workspace.entity';
import { PushPlatforms } from '@/api/templates/entities/template.entity';
import { PushFirebasePlatforms } from '@/api/accounts/entities/accounts.entity';

@Entity()
@Unique(['workspaceId', 'pushPlatforms'])
@Unique(['workspaceId', 'name'])
export class WorkspacePushConnection {
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

  @Column({
    type: 'jsonb',
    default: {
      [PushPlatforms.IOS]: undefined,
      [PushPlatforms.ANDROID]: undefined,
    },
  })
  pushPlatforms: PushFirebasePlatforms;

  @Column()
  workspaceId: string;
}
