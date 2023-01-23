import { Audience } from '@/api/audiences/entities/audience.entity';
import {
  Column,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';

@Entity()
export class WebhookEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @JoinColumn()
  @ManyToOne(() => Audience, (audience) => audience.id, { onDelete: 'CASCADE' })
  audience: Audience;

  @Column()
  customerId: string;

  @Column()
  messageId: string;

  @Column()
  event: string;

  @Column({ type: 'enum', enum: ['mailgun', 'sendgrid', 'twillio'] })
  eventProvider: 'mailgun' | 'sendgrid' | 'twillio';

  @Column()
  createdAt: string;
}
