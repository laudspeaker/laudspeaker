import {
  IsEnum,
  ValidateNested,
  IsObject,
  IsBoolean,
  IsString,
  IsOptional,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Trim } from 'class-sanitizer';
import { AttributeTypeName } from '../entities/attribute-type.entity';
import { CustomerKey } from '../entities/customer-keys.entity';

export enum ImportOptions {
  NEW = 'NEW',
  EXISTING = 'EXISTING',
  NEW_AND_EXISTING = 'NEW_AND_EXISTING',
}

class ManualSegmentCreation {
  @IsString()
  @Trim()
  name: string;

  @IsOptional()
  @Trim()
  @IsString()
  description: string;
}

class ImportAttribute {
  @IsOptional()
  @Type(() => CustomerKey)
  attribute?: CustomerKey;

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
  is_primary: boolean;

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

  @IsOptional()
  @ValidateNested()
  @Type(() => ManualSegmentCreation)
  withSegment?: ManualSegmentCreation;
}
