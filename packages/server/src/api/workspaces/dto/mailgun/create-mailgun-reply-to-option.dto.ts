import { IsNotEmpty, IsString } from 'class-validator';

export class CreateMailgunReplyToOption {
  @IsNotEmpty()
  @IsString()
  replyToEmail: string;

  @IsNotEmpty()
  @IsString()
  replyToName: string;
}
