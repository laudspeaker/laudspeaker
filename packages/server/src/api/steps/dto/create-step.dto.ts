import { IsString, IsBoolean, IsOptional, IsArray, IsEnum, IsJSON } from 'class-validator';
import { StepType, StepTypeMetadata } from '../types/step.interface';

export class CreateStepDto {
  @IsEnum(StepType)
  public type: StepType;

  @IsJSON()
  public metadata: StepTypeMetadata

  @IsString()
  public journeyID: string;
}
