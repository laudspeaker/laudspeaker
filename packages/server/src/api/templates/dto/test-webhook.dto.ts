import { IsNotEmpty, IsString } from 'class-validator';

export class TestWebhookDto {
  @IsNotEmpty()
  @IsString()
  testCustomerEmail: string;
}
