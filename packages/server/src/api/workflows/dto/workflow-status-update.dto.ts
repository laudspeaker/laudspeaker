import { Trim } from 'class-sanitizer';
import { IsNotEmpty } from 'class-validator';

export class WorkflowStatusUpdateDTO {
  @Trim()
  @IsNotEmpty()
  public id: string;
}
