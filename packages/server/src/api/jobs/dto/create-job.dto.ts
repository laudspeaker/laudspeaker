import {
  IsString,
  IsNotEmpty,
  IsDate,
  ValidateIf,
  IsEnum,
} from 'class-validator';
import { TimeJobType } from '../entities/job.entity';

export class CreateJobDto {
  @IsString()
  @IsNotEmpty()
  public customer: string;

  @ValidateIf((o) => o.endTime)
  @IsDate()
  @IsNotEmpty()
  public startTime: Date;

  @ValidateIf((o) => o.startTime)
  @IsDate()
  @IsNotEmpty()
  public endTime: Date;

  @ValidateIf((o) => !o.startTime && !o.endTime)
  @IsDate()
  @IsNotEmpty()
  public executionTime: Date;

  @IsString()
  @IsNotEmpty()
  public workflow: string;

  @IsString()
  @IsNotEmpty()
  public from: string;

  @IsString()
  @IsNotEmpty()
  public to: string;

  @IsEnum(TimeJobType)
  public type: TimeJobType;
}
