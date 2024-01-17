import { Trim } from 'class-sanitizer';
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

export class UpsertCustomerDto {
  @Trim()
  @IsString()
  @IsNotEmpty()
  public primary_key!: string;

  @IsObject()
  @IsOptional()
  public properties?: any;
}
