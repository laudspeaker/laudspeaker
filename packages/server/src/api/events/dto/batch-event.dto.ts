import { ToDate } from 'class-sanitizer';
import {
  IsOptional,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { EventDto } from './event.dto';
import { Type } from 'class-transformer';

export class BatchEventDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EventDto)
  public batch: EventDto[];

  @ToDate()
  @IsDateString()
  @IsOptional()
  public sentAt: Date;
}
