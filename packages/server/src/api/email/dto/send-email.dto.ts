import { IsString, IsArray, IsOptional } from 'class-validator';

export class SendEmailDto {
  @IsArray()
  @IsOptional()
  public to: Array<string>;

  @IsString()
  public subject: string;

  @IsString()
  public text: string;
}
