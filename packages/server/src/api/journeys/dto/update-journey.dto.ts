import { Trim } from 'class-sanitizer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
  IsObject,
} from 'class-validator';

export class UpdateJourneyDto {
  @IsString()
  id: string;

  @Trim()
  @IsNotEmpty()
  @IsOptional()
  public name?: string;

  @IsOptional()
  public visualLayout?: any;

  @IsObject()
  @IsOptional()
  public inclusionCriteria?: any;

  @IsBoolean()
  @IsOptional()
  public isDynamic?: boolean;
}
