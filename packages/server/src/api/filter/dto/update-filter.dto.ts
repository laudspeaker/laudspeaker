import { InclusionCriteria } from '@/api/segments/types/segment.type';
import { IsOptional, IsObject } from 'class-validator';

export class UpdateFilterDTO {
  @IsObject()
  @IsOptional()
  public inclusionCriteria?: InclusionCriteria;

  @IsObject()
  @IsOptional()
  public resources?: any;
}
