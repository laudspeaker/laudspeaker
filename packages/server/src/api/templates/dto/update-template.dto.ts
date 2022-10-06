import { Trim } from 'class-sanitizer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateTemplateDto {
  @Trim()
  @IsNotEmpty()
  public name: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public subject: string;

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
  public slackMessage: string;

  //todo for sms

  @IsNotEmpty()
  public type: 'email' | 'slack' | 'sms';
}
