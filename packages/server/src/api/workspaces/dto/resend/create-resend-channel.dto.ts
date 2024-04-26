import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { CreateResendSendingOption } from './create-resend-sending-option.dto';

export class CreateResendChannelDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  apiKey: string;

  @IsNotEmpty()
  @IsString()
  sendingDomain: string;

  @IsNotEmpty()
  @IsString()
  signingSecret: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested()
  @Type(() => CreateResendSendingOption)
  sendingOptions: CreateResendSendingOption[];
}
