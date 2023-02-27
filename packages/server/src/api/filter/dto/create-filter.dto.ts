import { InclusionCriteria } from '@/api/segments/types/segment.type';
import { Trim } from 'class-sanitizer';
import { IsString, IsOptional, IsNotEmpty, IsObject } from 'class-validator';

export class CreateFilterDTO {
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
