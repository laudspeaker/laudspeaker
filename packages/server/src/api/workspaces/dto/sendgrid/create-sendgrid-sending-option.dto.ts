import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSendgridSendingOption {
  @IsNotEmpty()
  @IsString()
  sendingEmail: string;
}
