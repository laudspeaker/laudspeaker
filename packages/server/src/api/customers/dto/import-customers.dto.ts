import {
  IsEnum,
  ValidateNested,
  IsObject,
  IsBoolean,
  IsString,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { AttributeType } from '../schemas/customer-keys.schema';

export enum ImportOptions {
  NEW = 'NEW',
  EXISTING = 'EXISTING',
  NEW_AND_EXISTING = 'NEW_AND_EXISTING',
}

class ImportAttribute {
  @IsString()
  key: string;

  @IsEnum(AttributeType)
  type: AttributeType;

  @IsOptional()
  @IsBoolean()
  skip?: boolean;
}

export class MappingParam {
  @IsOptional()
  @ValidateNested()
  @Type(() => ImportAttribute)
  asAttribute?: ImportAttribute;

  @IsOptional()
  @IsBoolean()
  isPrimary: boolean;

  @IsOptional()
  @IsBoolean()
  doNotOverwrite: boolean;
}

export class ImportCustomersDTO {
  @IsObject()
  @Type(() => MappingParam)
  mapping: Record<string, MappingParam>;

  @IsEnum(ImportOptions)
  importOption: ImportOptions;

  @IsString()
  fileKey: string;
}
