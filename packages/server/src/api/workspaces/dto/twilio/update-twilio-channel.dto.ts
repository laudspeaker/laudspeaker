import { IsOptional, IsString } from 'class-validator';

export class UpdateTwilioChannelDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  sid?: string;

  @IsString()
  @IsOptional()
  token?: string;

  @IsString()
  @IsOptional()
  from?: string;
}
