import { Trim } from 'class-sanitizer';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class EventDto {
  @IsString()
  @Trim()
  @IsNotEmpty()
  public correlationKey: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  public correlationValue: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  public event: string;

  @Trim()
  @IsString()
  @IsNotEmpty()
  @IsOptional()
  public source: string;

  @IsString()
  @IsOptional()
  public payload: string;
}
