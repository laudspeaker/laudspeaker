import { IsString, IsNotEmpty, IsDate, ValidateIf } from 'class-validator';

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
}
