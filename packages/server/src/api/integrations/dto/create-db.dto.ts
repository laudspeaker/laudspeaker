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

export class CreateDBDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  description?: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  @Max(1000)
  frequencyNumber: number;

  @IsNotEmpty()
  @IsEnum(FrequencyUnit)
  frequencyUnit: FrequencyUnit;

  @IsNotEmpty()
  @IsEnum(PeopleIdentification)
  peopleIdentification: PeopleIdentification;

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
