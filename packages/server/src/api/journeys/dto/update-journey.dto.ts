import { Trim } from 'class-sanitizer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  IsBoolean,
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

  @IsUUID()
  @IsOptional()
  public filterId?: string;

  @IsBoolean()
  @IsOptional()
  public isDynamic?: boolean;
}
