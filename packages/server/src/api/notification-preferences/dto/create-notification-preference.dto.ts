import { IsString, IsOptional, IsArray } from 'class-validator';

export class CreateNotificationPreferenceDto {
  @IsString()
  name: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  journey_tags?: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  channels?: string[];

  @IsArray()
  @IsOptional()
  @IsString({ each: true })
  template_tags?: string[];
}
