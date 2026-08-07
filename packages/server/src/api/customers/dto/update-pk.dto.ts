import { IsInstance, IsNotEmpty, IsString, MinLength } from 'class-validator';
import { AttributeType } from '../entities/attribute-type.entity';
import { Type } from 'class-transformer';

export class UpdatePK_DTO {
  @MinLength(0)
  @IsString()
  name: string;

  @Type(() => AttributeType)
  @IsInstance(AttributeType)
  @IsNotEmpty()
  attribute_type: AttributeType;
}
