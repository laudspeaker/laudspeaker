import { IsBoolean, IsString } from 'class-validator';

export class StartWorkflowDto {
  @IsBoolean()
  public isActive: boolean;

  @IsString()
  public id: string;
}
