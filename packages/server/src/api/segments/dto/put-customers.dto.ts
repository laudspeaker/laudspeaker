import { Trim } from 'class-sanitizer';
import { IsString, IsNotEmpty, IsArray } from 'class-validator';

export class PutCutomersDTO {
  @IsArray({ each: true })
  @IsString()
  @Trim()
  @IsNotEmpty()
  public customerIds: string[];
}
