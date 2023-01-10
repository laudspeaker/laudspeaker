import { InclusionCriteria } from '@/api/segments/types/segment.type';
import { IsString, IsBoolean, IsOptional, IsObject } from 'class-validator';

export class UpdateAudienceDto {
  @IsString()
  public id: string;

  @IsString()
  @IsOptional()
  public name: string;

  @IsString()
  @IsOptional()
  public description: string;

  @IsBoolean()
  @IsOptional()
  public isPrimary: boolean;

  @IsBoolean()
  @IsOptional()
  public isDynamic: boolean;

  @IsObject()
  @IsOptional()
  public inclusionCriteria: InclusionCriteria;

  @IsOptional()
  @IsString()
  public templates: string[];

  @IsOptional()
  public resources: any;
}
