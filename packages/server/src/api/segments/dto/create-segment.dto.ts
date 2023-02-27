import { Trim } from 'class-sanitizer';
import { IsString, IsNotEmpty } from 'class-validator';

export class CreateSegmentDTO {
  @IsString()
  @Trim()
  @IsNotEmpty()
  public name: string;
}
