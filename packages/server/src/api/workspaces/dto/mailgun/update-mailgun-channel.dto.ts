import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CreateMailgunSendingOption } from './create-mailgun-sending-option.dto';

export class UpdateMailgunChannelDto {
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
  @IsArray()
  @ValidateNested()
  @Type(() => CreateMailgunSendingOption)
  sendingOptions?: CreateMailgunSendingOption[];
}
