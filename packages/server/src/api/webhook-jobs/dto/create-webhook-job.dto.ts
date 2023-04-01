import {
    IsEnum,
  } from 'class-validator';
  import { WebhookJobStatus, WebhookProvider } from '../entities/webhook-job.entity';
  
  export class CreateWebhookJobDto {
    @IsEnum(WebhookJobStatus)
    public status: WebhookJobStatus;

    @IsEnum(WebhookProvider)
    public provider: WebhookProvider;
  }
  