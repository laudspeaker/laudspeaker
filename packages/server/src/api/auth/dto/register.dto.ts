import { Trim } from 'class-sanitizer';
import {
  IsEmail,
  IsString,
  MinLength,
  IsNotEmpty,
  IsOptional,
  IsUUID,
} from 'class-validator';

export class RegisterDto {
  @Trim()
  @IsEmail()
  public readonly email: string;

  @IsString()
  @IsNotEmpty()
  public readonly firstName: string;

  @IsString()
  @IsNotEmpty()
  public readonly lastName: string;

  @IsString()
  @MinLength(8)
  public readonly password: string;

  @IsOptional()
  @IsString()
  @IsUUID()
  public readonly fromInviteId: string;
}
