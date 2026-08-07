import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { Workspaces } from './workspaces.entity';
import { SendgridSendingOption } from './sendgrid-sending-option.entity';
import { SendgridReplyToOption } from './sendgrid-reply-to-option.entity';

@Entity()
export class WorkspaceSendgridConnection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @JoinColumn()
  @ManyToOne(() => Workspaces, (workspace) => workspace.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  workspace: Workspaces;

  @Column()
  name: string;

  @Column()
  apiKey: string;

  @Column()
  verificationKey: string;

  @OneToMany(() => SendgridSendingOption, (option) => option.sendgridConnection)
  sendingOptions: SendgridSendingOption[];

  @OneToMany(() => SendgridReplyToOption, (option) => option.sendgridConnection)
  replyToOptions: SendgridReplyToOption[];

  @Column()
  workspaceId: string;
}
