import { Trim } from 'class-sanitizer';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

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
}
