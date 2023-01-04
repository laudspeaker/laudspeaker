import { Trim } from 'class-sanitizer';
import {
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsString,
  IsUUID,
  IsBoolean,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Trigger } from '../entities/workflow.entity';

export class UpdateWorkflowDto {
  @IsString()
  id: string;

  @Trim()
  @IsNotEmpty()
  @IsOptional()
  public name?: string;

  @IsArray()
  @IsNotEmpty()
  @IsOptional()
  public audiences?: string[];

  @IsOptional()
  @Type(() => Trigger)
  public rules?: Trigger[];

  @IsOptional()
  public visualLayout?: any;

  @IsUUID()
  @IsOptional()
  public segmentId?: string;

  @IsBoolean()
  @IsOptional()
  public isDynamic?: boolean;
}
