import { InclusionCriteria } from '@/api/segments/types/segment.type';
import { Trim } from 'class-sanitizer';
import { IsString, IsOptional, IsNotEmpty, IsObject } from 'class-validator';

export class UpdateFilterDTO {
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
