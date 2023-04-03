import { Trim } from 'class-sanitizer';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateTemplateDto {
  @Trim()
  @IsNotEmpty()
  @MaxLength(255)
  public name: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public subject: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public text: string;

  @IsEmail({}, { each: true })
  public cc: string[];

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public style: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(2000)
  public slackMessage: string;

  //todo for sms

  @IsNotEmpty()
  public type: 'email' | 'slack' | 'sms' | 'firebase';

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(2000)
  public smsText: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(256)
  public pushText: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(48)
  public pushTitle: string;
}
