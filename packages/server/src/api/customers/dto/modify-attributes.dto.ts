import { AttributeType } from '@/api/customers/schemas/customer-keys.schema';
import { Type } from 'class-transformer';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';

export class CreateAttributeDto {
  @IsString()
  @IsNotEmpty()
  key: string;

  @IsEnum(AttributeType)
  @IsNotEmpty()
  type: AttributeType;

  @IsString()
  @IsOptional()
  dateFormat?: string;

  @IsBoolean()
  isArray: boolean;
}

export class UpdateAttributeDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  key: string;
}

export class DeleteAttributeDto {
  @IsString()
  @IsNotEmpty()
  id: string;
}

export class ModifyAttributesDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateAttributeDto)
  created: CreateAttributeDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => UpdateAttributeDto)
  updated: UpdateAttributeDto[];

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => DeleteAttributeDto)
  deleted: DeleteAttributeDto[];
}
