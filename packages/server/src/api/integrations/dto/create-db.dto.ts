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

export class CreateDBDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsNotEmpty()
  @IsString()
  @IsOptional()
  description?: string;

  @IsNotEmpty()
  @IsNumber()
  frequencyNumber: number;

  @IsNotEmpty()
  @IsEnum(FrequencyUnit)
  frequencyUnit: FrequencyUnit;

  @IsNotEmpty()
  @IsEnum(PeopleIdentification)
  peopleIdentification: PeopleIdentification;

  @IsNotEmpty()
  @IsBoolean()
  syncToASegment: boolean;

  @IsString()
  connectionString?: string;

  @IsNotEmpty()
  @IsEnum(DBType)
  dbType: DBType;

  @IsNotEmpty()
  @IsString()
  query: string;

  @IsObject()
  databricksData: { host?: string; path?: string; token?: string };
}
