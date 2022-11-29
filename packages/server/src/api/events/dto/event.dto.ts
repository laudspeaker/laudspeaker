import { Trim } from 'class-sanitizer';
import { IsString, IsNotEmpty, IsOptional, IsObject } from 'class-validator';

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
  @IsOptional()
  public source: string;

  @IsString()
  @IsOptional()
  public payload: string;

  @IsNotEmpty()
  @IsObject()
  public event?: Record<string, any>;
}
