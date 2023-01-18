import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import {
  DBType,
  FrequencyUnit,
  PeopleIdentification,
} from '../entities/database.entity';

export class UpdateDBDto {
  @IsNotEmpty()
  @IsString()
  @IsOptional()
  name?: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  description?: string;

  @IsNotEmpty()
  @IsNumber()
  @IsOptional()
  frequencyNumber?: number;

  @IsNotEmpty()
  @IsEnum(FrequencyUnit)
  @IsOptional()
  frequencyUnit?: FrequencyUnit;

  @IsNotEmpty()
  @IsEnum(PeopleIdentification)
  @IsOptional()
  peopleIdentification?: PeopleIdentification;

  @IsNotEmpty()
  @IsBoolean()
  @IsOptional()
  syncToASegment?: boolean;

  @IsString()
  @IsOptional()
  connectionString?: string;

  @IsNotEmpty()
  @IsEnum(DBType)
  @IsOptional()
  dbType?: DBType;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  query?: string;

  @IsObject()
  @IsOptional()
  databricksData: { host?: string; path?: string; token?: string };
}
