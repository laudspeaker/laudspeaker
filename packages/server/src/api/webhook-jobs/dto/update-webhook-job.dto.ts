import { IsNotEmpty, IsNumber, IsEnum, IsOptional } from 'class-validator';
import {
  WebhookJobStatus,
  WebhookProvider,
} from '../entities/webhook-job.entity';

export class UpdateWebhookJobDto {
  @IsEnum(WebhookJobStatus)
  @IsOptional()
  public status: WebhookJobStatus;
}
