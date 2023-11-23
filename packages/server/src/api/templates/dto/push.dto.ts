import {
  IsNotEmpty,
  IsObject,
  IsEmail,
  IsOptional,
  IsString,
  MaxLength,
  IsArray,
  ValidateNested,
  // Додаткові імпорти для валідації
  IsBoolean,
  IsEnum,
  ValidateIf,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  PlatformSettings,
  PushClickBehavior,
  PushPlatforms,
} from '../entities/template.entity';

export class PushBuilderDataDto {
  @IsNotEmpty()
  @IsObject()
  platform: Record<PushPlatforms, boolean>;

  @IsNotEmpty()
  @IsBoolean()
  keepContentConsistent: boolean;

  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => PlatformSettingsDto)
  settings: Record<PushPlatforms, PlatformSettings>;

  @IsNotEmpty()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => KeyValueDto)
  fields: KeyValueDto[];
}

class PlatformSettingsDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsOptional()
  @IsObject()
  image?: { key: string; imageSrc: string };

  @IsNotEmpty()
  @IsObject()
  @ValidateNested()
  @Type(() => ClickBehaviorDto)
  clickBehavior: {
    type: PushClickBehavior;
    webURL: string;
  };

  @IsNotEmpty()
  @IsString()
  summary: string;

  @IsOptional()
  @IsObject()
  expandedImage?: { key: string; imageSrc: string };
}

class ClickBehaviorDto {
  @IsEnum(PushClickBehavior)
  type: PushClickBehavior;

  @IsNotEmpty()
  @IsString()
  webURL: string;
}

class KeyValueDto {
  @IsNotEmpty()
  @IsString()
  key: string;

  @IsNotEmpty()
  @IsString()
  value: string;
}

