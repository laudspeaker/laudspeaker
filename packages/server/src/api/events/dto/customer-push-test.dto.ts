import { PushBuilderDataDto } from '@/api/templates/dto/push.dto';
import { IsNotEmpty, IsObject, IsString } from 'class-validator';

export class CustomerPushTest {
  @IsNotEmpty()
  @IsString()
  public customerId: string;

  @IsNotEmpty()
  @IsObject()
  // TODO: fix object error
  // @ValidateNested()
  // @Type(() => PushBuilderDataDto)
  public pushObject: PushBuilderDataDto;
}
