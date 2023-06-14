import { IsString, IsEnum } from 'class-validator';
import { StepType } from '../types/step.interface';

export class CreateStepDto {
  @IsEnum(StepType)
  public type: StepType;

  @IsString()
  public journeyID: string;
}
