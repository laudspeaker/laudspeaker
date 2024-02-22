import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMailgunSendingOption {
  @IsNotEmpty()
  @IsString()
  sendingEmail: string;

  @IsNotEmpty()
  @IsString()
  sendingName: string;
}
