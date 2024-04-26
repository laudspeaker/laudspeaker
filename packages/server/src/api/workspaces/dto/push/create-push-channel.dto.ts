import { PushFirebasePlatforms } from '@/api/accounts/entities/accounts.entity';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class CreatePushChannelDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsObject()
  @IsNotEmpty()
  pushPlatforms: PushFirebasePlatforms;
}
