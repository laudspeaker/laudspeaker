import { Trim } from 'class-sanitizer';
import { IsString, IsOptional, IsNotEmpty, IsObject } from 'class-validator';
import { InclusionCriteria } from '../types/segment.type';

export class CreateSegmentDTO {
  @IsString()
  @Trim()
  @IsNotEmpty()
  public name: string;

  @IsObject()
  @IsOptional()
  public inclusionCriteria: InclusionCriteria;

  @IsObject()
  public resources: any;
}
