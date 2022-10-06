import { IsString } from 'class-validator';

export class AddTemplateDto {
  @IsString()
  public audienceId: string;

  @IsString()
  public templateId: string;
}
