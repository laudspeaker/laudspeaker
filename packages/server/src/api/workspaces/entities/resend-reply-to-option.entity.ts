import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { WorkspaceResendConnection } from './workspace-resend-connection.entity';

@Entity()
@Unique(['resendConnectionId', 'replyToEmail', 'replyToName'])
export class ResendReplyToOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @JoinColumn()
  @ManyToOne(() => WorkspaceResendConnection, (connection) => connection.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  resendConnection: WorkspaceResendConnection;

  @Column()
  replyToEmail: string;

  @Column({ nullable: true })
  replyToName: string;

  @Column()
  resendConnectionId: string;
}
