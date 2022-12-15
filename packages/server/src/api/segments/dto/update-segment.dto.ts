import { Trim } from 'class-sanitizer';
import { IsString, IsOptional, IsNotEmpty, IsObject } from 'class-validator';
import { InclusionCriteria } from '../types/segment.type';

export class UpdateSegmentDTO {
  @IsString()
  @Trim()
  @IsNotEmpty()
  @IsOptional()
  public name?: string;

  @IsObject()
  @IsOptional()
  public inclusionCriteria?: InclusionCriteria;

  @IsObject()
  @IsOptional()
  public resources?: any;
}
