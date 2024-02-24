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
import { MailgunSendingOption } from './mailgun-sending-option.entity';

@Entity()
export class WorkspaceMailgunConnection {
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
  sendingDomain: string;

  @OneToMany(() => MailgunSendingOption, (option) => option.mailgunConnection)
  sendingOptions: MailgunSendingOption[];

  @Column()
  workspaceId: string;
}
