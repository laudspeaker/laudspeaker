import { Process, Processor } from '@nestjs/bull';
import {
  HttpException,
  Inject,
  Injectable,
  LoggerService,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Job } from 'bull';
import mongoose, { Model } from 'mongoose';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AccountsService } from '../accounts/accounts.service';
import { Account } from '../accounts/entities/accounts.entity';
import { Correlation, CustomersService } from '../customers/customers.service';
import { WorkflowTick } from '../workflows/interfaces/workflow-tick.interface';
import { WorkflowsService } from '../workflows/workflows.service';
import { EventDto } from './dto/event.dto';
import { PosthogBatchEventDto } from './dto/posthog-batch-event.dto';
import { PostHogEventDto } from './dto/posthog-event.dto';
import { EventDocument } from './schemas/event.schema';
import {
  PosthogEventType,
  PosthogEventTypeDocument,
} from './schemas/posthog-event-type.schema';
import { AudiencesService } from '../audiences/audiences.service';
import { Workflow } from '../workflows/entities/workflow.entity';
import { Audience } from '../audiences/entities/audience.entity';
import { CustomerDocument } from '../customers/schemas/customer.schema';
import { Segment } from '../segments/entities/segment.entity';
import errors from '@/shared/utils/errors';
import { DataSource } from 'typeorm';

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

@Processor('events')
@Injectable()
export class EventsProcessor {
  constructor(
    private dataSource: DataSource,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectModel(Event.name)
    private EventModel: Model<EventDocument>,
    @Inject(AccountsService) private readonly userService: AccountsService,
    @Inject(WorkflowsService)
    private readonly workflowsService: WorkflowsService,
    @Inject(CustomersService)
    private readonly customersService: CustomersService,
    @Inject(AudiencesService) private audiencesService: AudiencesService,
    @InjectModel(PosthogEventType.name)
    private PosthogEventTypeModel: Model<PosthogEventTypeDocument>,
    @InjectConnection() private readonly connection: mongoose.Connection
  ) {}
}
