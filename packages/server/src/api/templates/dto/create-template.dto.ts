import { Trim } from 'class-sanitizer';
import {
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { TemplateType, WebhookData } from '../entities/template.entity';

export class CreateTemplateDto {
  @Trim()
  @IsNotEmpty()
  @MaxLength(255)
  public name: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public subject?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public text?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public style?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(2000)
  public slackMessage?: string;

  @IsNotEmpty()
  public type: TemplateType;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(2000)
  public smsText?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(256)
  public pushText?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(48)
  public pushTitle?: string;

  @IsObject()
  @IsOptional()
  public webhookData?: WebhookData;
}
