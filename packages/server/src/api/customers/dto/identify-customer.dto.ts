import { Trim } from 'class-sanitizer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class IdentifyCustomerDTO {
  @IsString()
  @Trim()
  @IsNotEmpty()
  public customerId: string;

  @IsString()
  @Trim()
  @IsNotEmpty()
  __PrimaryKey: string;

  @IsOptional()
  optionalProperties?: { [key: string]: unknown };
}

