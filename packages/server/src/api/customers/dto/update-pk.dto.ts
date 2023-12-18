import { IsEnum, IsString, MinLength } from 'class-validator';
import { AttributeType } from '../schemas/customer-keys.schema';

export class UpdatePK_DTO {
  @MinLength(0)
  @IsString()
  key: string;

  @IsEnum(AttributeType)
  type: AttributeType;
}

