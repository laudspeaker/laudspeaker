import { Trim } from 'class-sanitizer';
import { IsNotEmpty, IsString, IsUUID } from 'class-validator';

export class DeleteWorkflowDto {
  @Trim()
  @IsString()
  @IsUUID()
  @IsNotEmpty()
  public workflowId: string;
}
