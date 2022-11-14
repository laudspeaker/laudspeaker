import { Trim } from 'class-sanitizer';
import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  IsFQDN,
  IsOptional,
  IsBoolean,
  isArray,
  IsArray,
} from 'class-validator';

export class UpdateAccountDto {
  @Trim()
  @IsEmail()
  @IsNotEmpty()
  @IsOptional()
  public email: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public firstName: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public lastName: string;

  @IsString()
  @IsOptional()
  public mailgunAPIKey: string;

  @IsFQDN()
  @IsOptional()
  public sendingDomain: string;

  @IsString()
  @IsOptional()
  public sendingName: string;

  @IsBoolean()
  @IsOptional()
  public onboarded: boolean;

  @IsString({ each: true })
  @IsNotEmpty()
  @IsOptional()
  public slackTeamId: [string];

  @IsString({ each: true })
  @IsNotEmpty()
  @IsOptional()
  public posthogApiKey: [string];

  @IsString({ each: true })
  @IsNotEmpty()
  @IsOptional()
  public posthogProjectId: [string];

  @IsString({ each: true })
  @IsNotEmpty()
  @IsOptional()
  public posthogHostUrl: [string];

  @IsString({ each: true })
  @IsNotEmpty()
  @IsOptional()
  public posthogSmsKey: [string];

  @IsString({ each: true })
  @IsNotEmpty()
  @IsOptional()
  public posthogEmailKey: [string];

  @IsArray()
  @IsOptional()
  public expectedOnboarding: string[];

  @IsString()
  @IsOptional()
  public finishedOnboarding: string;

  @IsString()
  @IsOptional()
  public sendingEmail: string;

  @IsString()
  @MinLength(8)
  @IsOptional()
  public currentPassword: string;

  @IsString()
  @MinLength(8)
  @IsOptional()
  public newPassword: string;

  @IsString()
  @MinLength(8)
  @IsOptional()
  public verifyNewPassword: string;

  @IsString()
  @IsOptional()
  public emailProvider: string;

  @IsString()
  @IsOptional()
  public testSendingName: string;

  @IsString()
  @IsOptional()
  public testSendingEmail: string;
}
