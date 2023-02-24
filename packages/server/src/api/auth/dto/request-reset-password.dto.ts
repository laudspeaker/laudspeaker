import { Trim } from 'class-sanitizer';
import { IsEmail } from 'class-validator';

export class RequestResetPasswordDto {
  @Trim()
  @IsEmail()
  public readonly email: string;
}
