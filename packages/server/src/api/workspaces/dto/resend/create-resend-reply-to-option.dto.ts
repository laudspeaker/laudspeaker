import { IsNotEmpty, IsString } from 'class-validator';

export class CreateResendReplyToOption {
  @IsNotEmpty()
  @IsString()
  replyToEmail: string;

  @IsNotEmpty()
  @IsString()
  replyToName: string;
}
