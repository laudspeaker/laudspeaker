import { Trim } from 'class-sanitizer';
import { IsString, IsNotEmpty } from 'class-validator';

export class AssignCustomerDTO {
  @IsString()
  @Trim()
  @IsNotEmpty()
  public customerId: string;
}
