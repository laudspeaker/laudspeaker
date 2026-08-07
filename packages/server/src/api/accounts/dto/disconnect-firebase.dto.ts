import { PushPlatforms } from '../../templates/entities/template.entity';
import { IsEnum, IsNotEmpty } from 'class-validator';

export class DisconnectFirebaseDTO {
  @IsEnum(PushPlatforms)
  @IsNotEmpty()
  public platform: PushPlatforms;
}
