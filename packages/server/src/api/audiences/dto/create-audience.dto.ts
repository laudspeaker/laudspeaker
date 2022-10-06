import {
  IsString,
  IsBoolean,
  IsJSON,
  IsOptional,
  IsObject,
} from 'class-validator';

export class CreateAudienceDto {
  @IsString()
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
  public inclusionCriteria: Record<string, unknown>;
}
