import { Trim } from 'class-sanitizer';
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';
import { InclusionCriteria } from '../types/segment.type';

export class UpdateSegmentDTO {
  @IsString()
  @Trim()
  @IsNotEmpty()
  @IsOptional()
  public name: string;

  @IsString()
  @Trim()
  @IsOptional()
  public description: string;

  @IsObject()
  @IsOptional()
  public inclusionCriteria: any;

  @IsObject()
  @IsOptional()
  public resources: any;
}
