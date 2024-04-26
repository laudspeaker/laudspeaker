import { IsNotEmpty, IsString } from 'class-validator';

export class CreateTwilioChannelDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsString()
  @IsNotEmpty()
  sid: string;

  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @IsNotEmpty()
  from: string;
}
