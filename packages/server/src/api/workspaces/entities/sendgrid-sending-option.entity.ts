import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { WorkspaceSendgridConnection } from './workspace-sendgrid-connection.entity';

@Entity()
@Unique(['sendgridConnectionId', 'sendingEmail'])
export class SendgridSendingOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @JoinColumn()
  @ManyToOne(() => WorkspaceSendgridConnection, (connection) => connection.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  sendgridConnection: WorkspaceSendgridConnection;

  @Column()
  sendingEmail: string;

  @Column()
  sendgridConnectionId: string;
}
