import { Trim } from 'class-sanitizer';
import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class InviteMemberDTO {
  @IsString()
  @Trim()
  @IsEmail()
  @IsNotEmpty()
  public email: string;
}
