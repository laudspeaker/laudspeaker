import { IsString, IsBoolean, IsOptional, IsArray } from 'class-validator';

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
  @IsArray()
  public templates: string[];

  @IsString()
  public workflowId: string;
}
