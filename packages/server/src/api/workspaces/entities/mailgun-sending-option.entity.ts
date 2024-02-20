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
@Unique(['mailgunConnectionId', 'sendingEmail', 'sendingName'])
export class MailgunSendingOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @JoinColumn()
  @ManyToOne(() => WorkspaceMailgunConnection, (connection) => connection.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  mailgunConnection: WorkspaceMailgunConnection;

  @Column()
  sendingEmail: string;

  @Column()
  sendingName: string;

  @Column()
  mailgunConnectionId: string;
}
