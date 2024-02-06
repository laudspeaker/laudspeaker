import { Trim } from 'class-sanitizer';
import { IsNotEmpty } from 'class-validator';

export class ReadCustomerDto {
  @Trim()
  @IsNotEmpty()
  public primary_key!: any;
}
