import { IsArray, IsNotEmpty, ValidateNested } from 'class-validator';
import { EventDto } from './event.dto';
import { Type } from 'class-transformer';

export class EventBatchDto {
  @IsArray()
  @IsNotEmpty()
  @Type(() => EventDto)
  @ValidateNested()
  batch: EventDto[];
}
