import { IsNotEmpty, IsObject, IsString } from 'class-validator';
import { WebhookData } from '../entities/template.entity';

export class TestWebhookDto {
  @IsNotEmpty()
  @IsString()
  testCustomerEmail: string;

  @IsNotEmpty()
  @IsObject()
  public webhookData: WebhookData;
}
