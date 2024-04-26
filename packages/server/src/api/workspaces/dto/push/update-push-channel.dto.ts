import { PushFirebasePlatforms } from '@/api/accounts/entities/accounts.entity';
import { IsObject, IsOptional, IsString } from 'class-validator';

export class UpdatePushChannelDto {
  @IsString()
  @IsOptional()
  name?: string;

  @IsObject()
  @IsOptional()
  pushPlatforms?: PushFirebasePlatforms;
}
