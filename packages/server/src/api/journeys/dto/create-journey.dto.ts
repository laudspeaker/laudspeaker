import { Trim } from 'class-sanitizer';
import { IsNotEmpty } from 'class-validator';

export class CreateJourneyDto {
  @Trim()
  @IsNotEmpty()
  public name: string;
}
