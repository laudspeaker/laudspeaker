import { IsNotEmpty } from 'class-validator';

export class StatusJobDto {
  @IsNotEmpty()
  jobId: string;
}
