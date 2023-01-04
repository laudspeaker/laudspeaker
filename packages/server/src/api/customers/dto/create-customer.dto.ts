import { Trim } from 'class-sanitizer';
import {
  IsEmail,
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
} from 'class-validator';

export class CreateCustomerDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public name?: string;

  @Trim()
  @IsEmail()
  @IsNotEmpty()
  @IsOptional()
  public email?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public firstName?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public lastName?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public externalId?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public correlationKey?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public correlationValue?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public slackName?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public slackId?: string;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public slackRealName?: string;

  @IsString({ each: true })
  @IsNotEmpty()
  @IsOptional()
  public slackTeamId?: [string];

  //minutes offset from utc (gmt)?

  @IsNotEmpty()
  @IsOptional()
  public slackTimeZone?: number;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public slackEmail?: string;

  @IsNotEmpty()
  @IsOptional()
  public slackDeleted?: boolean;

  @IsNotEmpty()
  @IsOptional()
  public slackAdmin?: boolean;

  //to filter out your own org

  @IsNotEmpty()
  @IsOptional()
  public slackTeamMember?: boolean;

  @IsBoolean()
  @IsOptional()
  verified?: boolean;

  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public phone?: string;
}
/*
example slack 

members: [
{
    id: 'xxxxx',
    team_id: 'xxxxxx',
    name: 'mahamad',
    deleted: false,
    color: '4bbe2e',
    real_name: 'Mahamad Charawi',
    tz: 'America/Los_Angeles',
    tz_label: 'Pacific Daylight Time',
    tz_offset: -25200,
    profile: [Object],
    is_admin: true,
    is_owner: true,
    is_primary_owner: false,
    is_restricted: false,
    is_ultra_restricted: false,
    is_bot: false,
    is_app_user: false,
    updated: xxxxx,
    is_email_confirmed: true,
    who_can_share_contact_card: 'EVERYONE'
  },
  {
    id: 'xxxxx',
    team_id: 'xxxxx',
    name: 'ya',
    deleted: false,
    color: 'e7392d',
    real_name: 'ya ya',
    tz: 'Europe/Athens',
    tz_label: 'Eastern European Summer Time',
    tz_offset: 10800,
    profile: [Object],
    is_admin: false,
    is_owner: false,
    is_primary_owner: false,
    is_restricted: false,
    is_ultra_restricted: false,
    is_bot: false,
    is_app_user: false,
    updated: 1620071427,
    is_email_confirmed: true,
    who_can_share_contact_card: 'EVERYONE'
  },
]
  */
