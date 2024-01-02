import { Trim } from 'class-sanitizer';
import { Type } from 'class-transformer';
import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  IsFQDN,
  IsOptional,
  IsBoolean,
  IsArray,
  IsObject,
  ValidateNested,
} from 'class-validator';

class PlatformCredentials {
  @IsString()
  @IsNotEmpty()
  fileName: string;

  @IsObject()
  credentials: JSON;

  @IsBoolean()
  isTrackingDisabled: boolean;
}

export class PushPlatformDto {
  @ValidateNested()
  @Type(() => PlatformCredentials)
  @IsOptional()
  Android?: PlatformCredentials;

  @ValidateNested()
  @Type(() => PlatformCredentials)
  @IsOptional()
  iOS?: PlatformCredentials;
}

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

  @IsString({ each: true })
  @IsNotEmpty()
  @IsOptional()
  public posthogFirebaseDeviceTokenKey: [string];

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public firebaseCredentials: string;

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

  @IsString()
  @IsOptional()
  public sendgridApiKey: string;

  @IsString()
  @IsOptional()
  public sendgridFromEmail: string;

  @IsString()
  @IsOptional()
  public smsAccountSid: string;

  @IsString()
  @IsOptional()
  public smsAuthToken: string;

  @IsString()
  @IsOptional()
  public smsFrom: string;

  @IsOptional()
  @Type(() => PushPlatformDto)
  @ValidateNested()
  pushPlatforms?: PushPlatformDto;

  @IsString()
  @IsOptional()
  timezoneUTCOffset?: string;
}
