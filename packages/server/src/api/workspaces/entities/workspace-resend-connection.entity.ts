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
import { ResendSendingOption } from './resend-sending-option.entity';

@Entity()
@Unique(['workspaceId', 'apiKey', 'signingSecret', 'sendingDomain'])
@Unique(['workspaceId', 'name'])
export class WorkspaceResendConnection {
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
  signingSecret: string;

  @Column()
  sendingDomain: string;

  @OneToMany(() => ResendSendingOption, (option) => option.resendConnection)
  sendingOptions: ResendSendingOption[];

  @Column()
  workspaceId: string;
}
