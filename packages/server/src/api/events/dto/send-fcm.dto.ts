import { PushPlatforms } from '@/api/templates/entities/template.entity';
import { Trim } from 'class-sanitizer';
import { IsEnum, IsNotEmpty, IsString } from 'class-validator';

export class SendFCMDto {
  @IsString()
  @Trim()
  @IsNotEmpty()
  public customerId: string;

  @IsNotEmpty()
  @IsEnum(PushPlatforms)
  public type: PushPlatforms;

  @IsNotEmpty()
  @IsString()
  public token: string;
}

