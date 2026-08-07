import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSendgridReplyToOption {
  @IsNotEmpty()
  @IsString()
  replyToEmail: string;

  @IsNotEmpty()
  @IsString()
  replyToName: string;
}
