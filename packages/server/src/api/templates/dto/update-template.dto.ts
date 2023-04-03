import { Trim } from 'class-sanitizer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  IsEmail,
} from 'class-validator';

export class UpdateTemplateDto {
  @Trim()
  @IsNotEmpty()
  @MaxLength(255)
  public name: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(2000)
  public subject: string;

  @IsEmail({}, { each: true })
  public cc: string[];

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public text: string;

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
  public type: 'email' | 'slack' | 'sms';

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  @MaxLength(2000)
  public smsText: string;
}
