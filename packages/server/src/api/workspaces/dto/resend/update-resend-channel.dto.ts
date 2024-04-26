import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CreateResendSendingOption } from './create-resend-sending-option.dto';

export class UpdateResendChannelDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;

  @IsOptional()
  @IsString()
  sendingDomain?: string;

  @IsOptional()
  @IsString()
  signingSecret?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => CreateResendSendingOption)
  sendingOptions?: CreateResendSendingOption[];
}
