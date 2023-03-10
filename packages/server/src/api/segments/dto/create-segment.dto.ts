import { Trim } from 'class-sanitizer';
import {
  IsString,
  IsNotEmpty,
  IsEnum,
  IsOptional,
  IsObject,
} from 'class-validator';
import { SegmentType } from '../entities/segment.entity';

export class CreateSegmentDTO {
  @IsString()
  @Trim()
  @IsNotEmpty()
  public name: string;

  @IsOptional()
  @IsString()
  @Trim()
  public description: string;

  @IsString()
  @IsNotEmpty()
  @IsEnum(SegmentType)
  public type: SegmentType;

  @IsObject()
  @IsOptional()
  public inclusionCriteria: any;

  @IsObject()
  @IsOptional()
  public resources: any;
}
