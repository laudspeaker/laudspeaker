import { Trim } from 'class-sanitizer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
  IsJSON,
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

  @IsJSON()
  @IsOptional()
  public inclusionCriteria?: any;

  @IsBoolean()
  @IsOptional()
  public isDynamic?: boolean;
}
