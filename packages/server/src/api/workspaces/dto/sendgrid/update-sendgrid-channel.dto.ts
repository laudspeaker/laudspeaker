import { Type } from 'class-transformer';
import { IsArray, IsOptional, IsString, ValidateNested } from 'class-validator';
import { CreateSendgridSendingOption } from './create-sendgrid-sending-option.dto';
import { CreateSendgridReplyToOption } from './create-sendgrid-reply-to-option.dto';

export class UpdateSendgridChannelDto {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  apiKey?: string;


  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => CreateSendgridSendingOption)
  sendingOptions?: CreateSendgridSendingOption[];

  @IsOptional()
  @IsArray()
  @ValidateNested()
  @Type(() => CreateSendgridReplyToOption)
  replyToOptions?: CreateSendgridReplyToOption[];
}
