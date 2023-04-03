import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum WebhookProvider {
  MAILGUN,
  TWILIO_SMS,
  SENDGRID,
}

export enum WebhookJobStatus {
  IN_PROGRESS,
  PENDING,
}

@Entity()
export class WebhookJob {
  @PrimaryGeneratedColumn()
  public id!: string;

  @Column({
    type: 'timestamp with time zone',
    nullable: false,
    default: () => 'CURRENT_TIMESTAMP',
  })
  public createdAt: Date;

  @Column({ enum: WebhookProvider })
  public provider: WebhookProvider;

  @Column({ enum: WebhookJobStatus, default: WebhookJobStatus.PENDING })
  public status: WebhookJobStatus;
}
