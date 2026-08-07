import { Type } from 'class-transformer';
import { IsArray, IsNotEmpty, IsString, ValidateNested } from 'class-validator';
import { CreateSendgridSendingOption } from './create-sendgrid-sending-option.dto';
import { CreateSendgridReplyToOption } from './create-sendgrid-reply-to-option.dto';

export class CreateSendgridChannelDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  apiKey: string;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested()
  @Type(() => CreateSendgridSendingOption)
  sendingOptions: CreateSendgridSendingOption[];

  @IsNotEmpty()
  @IsArray()
  @ValidateNested()
  @Type(() => CreateSendgridReplyToOption)
  replyToOptions: CreateSendgridReplyToOption[];
}
