import { Trim } from 'class-sanitizer';
import { IsNotEmpty } from 'class-validator';

export class CreateWorkflowDto {
  @Trim()
  @IsNotEmpty()
  public name: string;
}
