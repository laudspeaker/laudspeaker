import { ToDate } from 'class-sanitizer';
import {
  IsNotEmpty,
  IsOptional,
  IsArray,
  ValidateNested,
  IsDateString,
} from 'class-validator';
import { PostHogEventDto } from './posthog-event.dto';
import { Type } from 'class-transformer';

export class PosthogBatchEventDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PostHogEventDto)
  public batch: PostHogEventDto[];

  @ToDate()
  @IsDateString()
  @IsNotEmpty()
  @IsOptional()
  public sentAt: Date;
}
