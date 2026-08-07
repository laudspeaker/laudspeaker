import { Trim } from 'class-sanitizer';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class SetCustomerPropsDTO {
  @IsString()
  @Trim()
  @IsNotEmpty()
  public customerId: string;

  @IsOptional()
  optionalProperties?: { [key: string]: unknown };
}
