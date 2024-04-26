import { IsNotEmpty, IsString } from 'class-validator';

export class CreateResendSendingOption {
  @IsNotEmpty()
  @IsString()
  sendingEmail: string;

  @IsNotEmpty()
  @IsString()
  sendingName: string;
}
