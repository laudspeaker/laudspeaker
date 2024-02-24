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
@Unique(['resendConnectionId', 'sendingEmail', 'sendingName'])
export class ResendSendingOption {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @JoinColumn()
  @ManyToOne(() => WorkspaceResendConnection, (connection) => connection.id, {
    onDelete: 'CASCADE',
    onUpdate: 'CASCADE',
  })
  resendConnection: WorkspaceResendConnection;

  @Column()
  sendingEmail: string;

  @Column()
  sendingName: string;

  @Column()
  resendConnectionId: string;
}
