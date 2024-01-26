import { Trim } from 'class-sanitizer';
import {
  IsNotEmpty,
  IsOptional,
  IsString,
  IsBoolean,
  IsObject,
  IsEnum,
} from 'class-validator';

export enum ChangeSegmentOption {
  CONTINUE_JOURNEY = 'continue',
  REMOVE_USERS = 'remove-user',
}

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

  @IsObject()
  @IsOptional()
  public journeyEntrySettings?: any;

  @IsObject()
  @IsOptional()
  public journeySettings?: any;

  @IsBoolean()
  @IsOptional()
  public isDynamic?: boolean;

  @IsEnum(ChangeSegmentOption)
  @IsOptional()
  changeSegmentOption?: ChangeSegmentOption;
}
