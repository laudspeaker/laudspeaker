import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { CreateMailgunSendingOption } from './create-mailgun-sending-option.dto';
import { CreateMailgunReplyToOption } from './create-mailgun-reply-to-option.dto';

export class CreateMailgunChannelDto {
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
  @IsArray()
  @ValidateNested()
  @Type(() => CreateMailgunSendingOption)
  sendingOptions: CreateMailgunSendingOption[];

  @IsNotEmpty()
  @IsArray()
  @ValidateNested()
  @Type(() => CreateMailgunReplyToOption)
  replyToOptions: CreateMailgunReplyToOption[];
}
