import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { WorkspaceMailgunConnection } from './workspace-mailgun-connection.entity';

@Entity()
@Unique(['mailgunConnectionId', 'replyToEmail', 'replyToName'])
export class MailgunReplyToOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @JoinColumn()
  @ManyToOne(() => WorkspaceMailgunConnection, (connection) => connection.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  mailgunConnection: WorkspaceMailgunConnection;

  @Column()
  replyToEmail: string;

  @Column({nullable: true})
  replyToName: string;

  @Column()
  mailgunConnectionId: string;
}
