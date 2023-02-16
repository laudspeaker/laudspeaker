import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
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
  @MaxLength(100)
  name?: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @IsNotEmpty()
  @IsNumber()
  @IsOptional()
  @Min(1)
  @Max(1000)
  frequencyNumber?: number;

  @IsNotEmpty()
  @IsEnum(FrequencyUnit)
  @IsOptional()
  frequencyUnit?: FrequencyUnit;

  @IsNotEmpty()
  @IsEnum(PeopleIdentification)
  @IsOptional()
  peopleIdentification?: PeopleIdentification;

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
