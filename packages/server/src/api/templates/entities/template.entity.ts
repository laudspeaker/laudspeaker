import { Account } from '../../accounts/entities/accounts.entity';
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { Workspace } from '@/api/workspaces/entities/workspace.entity';

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
  WEBHOOK = 'webhook',
  MODAL = 'modal',
  CUSTOM_COMPONENT = 'custom_component',
  PUSH = 'push',
}

export enum PushPlatforms {
  IOS = 'iOS',
  ANDROID = 'Android',
}

export enum PushClickBehavior {
  OPEN_APP = 'OPEN_APP',
  REDIRECT_URL = 'REDIRECT_URL',
}

export interface PlatformSettings {
  title: string;
  description: string;
  image?: { key: string; imageSrc: string };
  clickBehavior: {
    type: PushClickBehavior;
    webURL: string;
  };
  summary: string;
  expandedImage?: { key: string; imageSrc: string };
}

export interface PushBuilderData {
  platform: Record<PushPlatforms, boolean>;
  keepContentConsistent: boolean;
  settings: Record<PushPlatforms, PlatformSettings>;
  fields: {
    key: string;
    value: string;
  }[];
}

@Entity()
export class Template {
  @PrimaryGeneratedColumn()
  public id!: string;

  @Column()
  name: string;

  @JoinColumn()
  @ManyToOne(() => Workspace, (workspace) => workspace.id, {
    onDelete: 'CASCADE',
  })
  workspace: Workspace;

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

  @Column({ type: 'jsonb', nullable: true })
  pushObject?: PushBuilderData;

  @Column({ default: false })
  isDeleted: boolean;

  @Column({ type: 'jsonb', nullable: true })
  webhookData?: WebhookData;

  @Column({ type: 'jsonb', nullable: true })
  modalState?: Record<string, unknown>;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  updatedAt?: Date;

  @Column('text', { nullable: false, array: true, default: [] })
  customEvents: string[];

  @Column({ type: 'jsonb', nullable: true })
  customFields?: Record<string, unknown>;
}
