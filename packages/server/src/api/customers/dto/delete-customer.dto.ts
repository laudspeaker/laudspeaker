import { Trim } from 'class-sanitizer';
import { IsString, IsNotEmpty } from 'class-validator';

export class DeleteCustomerDto {
  @Trim()
  @IsNotEmpty()
  public primary_key!: any;
}
