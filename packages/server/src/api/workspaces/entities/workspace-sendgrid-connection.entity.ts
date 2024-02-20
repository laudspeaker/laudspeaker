import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Workspace } from './workspace.entity';
import { SendgridSendingOption } from './sendgrid-sending-option.entity';

@Entity()
@Unique(['workspaceId', 'apiKey'])
@Unique(['workspaceId', 'name'])
export class WorkspaceSendgridConnection {
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
  apiKey: string;

  @Column()
  verificationKey: string;

  @OneToMany(() => SendgridSendingOption, (option) => option.sendgridConnection)
  sendingOptions: SendgridSendingOption[];

  @Column()
  workspaceId: string;
}
