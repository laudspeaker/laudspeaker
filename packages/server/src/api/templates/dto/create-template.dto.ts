import { Trim } from 'class-sanitizer';
import {
  IsNotEmpty,
  IsObject,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  IsArray,
  ValidateNested,
} from 'class-validator';
import { TemplateType, WebhookData } from '../entities/template.entity';
import { Type } from 'class-transformer';

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

  @IsOptional()
  @IsEmail({}, { each: true })
  public cc?: string[];

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
  public pushText?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public pushTitle?: string;

  @IsObject()
  @IsOptional()
  public webhookData?: WebhookData;

  @IsObject()
  @IsOptional()
  public modalState?: Record<string, unknown>;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => String)
  customEvents?: string[];

  @IsOptional()
  @IsObject()
  customFields?: Record<string, unknown>;
}
