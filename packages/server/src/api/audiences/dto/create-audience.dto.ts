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

  @IsOptional()
  public templates: string[];
}
