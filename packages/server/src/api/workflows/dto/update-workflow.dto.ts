import { Trim } from 'class-sanitizer';
import {
  IsNotEmpty,
  IsOptional,
  IsArray,
  IsJSON,
  IsBoolean,
  IsString,
} from 'class-validator';
import { Type } from 'class-transformer';
import { Trigger } from '../entities/workflow.entity';

export class UpdateWorkflowDto {
  @IsString()
  id: string;

  @Trim()
  @IsNotEmpty()
  @IsOptional()
  public name: string;

  @IsArray()
  @IsNotEmpty()
  @IsOptional()
  public audiences: string[];

  @IsArray()
  @IsOptional()
  @Type(() => Trigger)
  public rules: Trigger[];

  @IsOptional()
  public visualLayout: any;
}
