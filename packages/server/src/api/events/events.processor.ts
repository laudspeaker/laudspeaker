import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Injectable } from '@nestjs/common';
import { Job } from 'bullmq';
import { Account } from '../accounts/entities/accounts.entity';
import { EventDto } from './dto/event.dto';
import { PosthogBatchEventDto } from './dto/posthog-batch-event.dto';

export interface StartDto {
  account: Account;
  workflowID: string;
}

export interface CustomEventDto {
  apiKey: string;
  eventDto: EventDto;
}

export interface PosthogEventDto {
  apiKey: string;
  eventDto: PosthogBatchEventDto;
}

@Injectable()
@Processor('events')
export class EventsProcessor extends WorkerHost {
  constructor() {
    super();
  }

  process(job: Job<any, any, string>, token?: string): Promise<any> {
    return;
  }
}
