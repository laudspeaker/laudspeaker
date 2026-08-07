import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  ValidateNested,
  IsInstance,
  IsNumber
} from 'class-validator';
import { AttributeType } from '../entities/attribute-type.entity';

export class CreateAttributeDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @Type(() => AttributeType)
  @IsInstance(AttributeType)
  @IsNotEmpty()
  attribute_type: AttributeType;

  @IsString()
  @IsOptional()
  attribute_subtype?: string;

  @IsString()
  @IsOptional()
  attribute_parameter?: string;
}

export class UpdateAttributeDto {
  @IsNumber()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  key: string;
}

export class DeleteAttributeDto {
  @IsNumber()
  @IsNotEmpty()
  id: number;
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
