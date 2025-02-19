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
@Unique(['sendgridConnectionId', 'replyToEmail', 'replyToName'])
export class SendgridReplyToOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @JoinColumn()
  @ManyToOne(() => WorkspaceSendgridConnection, (connection) => connection.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  sendgridConnection: WorkspaceSendgridConnection;

  @Column()
  replyToEmail: string;

  @Column({nullable: true})
  replyToName: string;

  @Column()
  sendgridConnectionId: string;
}
