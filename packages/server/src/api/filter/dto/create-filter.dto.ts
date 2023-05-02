import { InclusionCriteria } from '../../segments/types/segment.type';
import { IsOptional, IsObject } from 'class-validator';

export class CreateFilterDTO {
  @IsObject()
  @IsOptional()
  public inclusionCriteria: InclusionCriteria;

  @IsObject()
  public resources: any;
}
