import { Account } from '@/api/accounts/entities/accounts.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';

export enum WebhookMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  PATCH = 'PATCH',
  DELETE = 'DELETE',
  HEAD = 'HEAD',
  OPTIONS = 'OPTIONS',
}

export type WebhookHeaders = { Authorization?: string } & Record<
  string,
  string
>;

export enum FallBackAction {
  NOTHING,
}

export interface WebhookData {
  url: string;
  method: WebhookMethod;
  body: string;
  headers: WebhookHeaders;
  retries: number;
  fallBackAction: FallBackAction;
}

export enum TemplateType {
  EMAIL = 'email',
  SLACK = 'slack',
  SMS = 'sms',
  FIREBASE = 'firebase',
  WEBHOOK = 'webhook',
  MODAL = 'modal',
}

@Entity()
export class Template {
  @PrimaryGeneratedColumn()
  public id!: string;

  @Column()
  name: string;

  @JoinColumn()
  @ManyToOne(() => Account, (account) => account.id, { onDelete: 'CASCADE' })
  owner: Account;

  @Column({ nullable: true })
  text: string;

  @Column({ nullable: true })
  style: string;

  @Column({ nullable: true })
  subject: string;

  @Column('text', { nullable: false, array: true, default: [] })
  cc: string[];

  @Column({ nullable: true })
  slackMessage: string;

  @Column({ enum: TemplateType })
  type: TemplateType;

  @Column({ nullable: true })
  smsText: string;

  @Column({ nullable: true })
  pushText: string;

  @Column({ nullable: true })
  pushTitle: string;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ type: 'jsonb', nullable: true })
  webhookData?: WebhookData;

  @Column({ type: 'jsonb', nullable: true })
  modalState?: Record<string, unknown>;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;
}
