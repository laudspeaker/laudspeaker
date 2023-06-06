import {
  IsString,
  IsBoolean,
  IsOptional,
  IsObject,
  IsEnum,
  IsJSON,
} from 'class-validator';
import { StepType, StepTypeMetadata } from '../types/step.interface';

export class UpdateStepDto {
  @IsString()
  public id: string;

  @IsEnum(StepType)
  public type: StepType;

  @IsJSON()
  public metadata: StepTypeMetadata;
}
