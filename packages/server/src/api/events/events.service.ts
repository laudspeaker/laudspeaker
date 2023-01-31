import {
  Injectable,
  Inject,
  LoggerService,
  HttpException,
} from '@nestjs/common';
import { Correlation, CustomersService } from '../customers/customers.service';
import { CustomerDocument } from '../customers/schemas/customer.schema';
import {
  EventsTable,
  CustomEventTable,
  JobTypes,
} from './interfaces/event.interface';
import { Account } from '../accounts/entities/accounts.entity';
import { PosthogBatchEventDto } from './dto/posthog-batch-event.dto';
import { EventDto } from './dto/event.dto';
import { AccountsService } from '../accounts/accounts.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { StatusJobDto } from './dto/status-event.dto';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { EventDocument, Event } from './schemas/event.schema';
import mockData from '@/fixtures/mockData';
import { EventKeys, EventKeysDocument } from './schemas/event-keys.schema';
import { attributeConditions } from '@/fixtures/attributeConditions';
import keyTypes from '@/fixtures/keyTypes';
import defaultEventKeys from '@/fixtures/defaultEventKeys';
import {
  PosthogEventType,
  PosthogEventTypeDocument,
} from './schemas/posthog-event-type.schema';
import { WorkflowTick } from '../workflows/interfaces/workflow-tick.interface';
import { DataSource } from 'typeorm';


@Injectable()
export class EventsService {
  constructor(
    private dataSource: DataSource,
    @Inject(AccountsService) private readonly userService: AccountsService,
    @Inject(WorkflowsService)
    private readonly workflowsService: WorkflowsService,
    @Inject(CustomersService)
    private readonly customersService: CustomersService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectQueue(JobTypes.email) private readonly emailQueue: Queue,
    @InjectQueue(JobTypes.slack) private readonly slackQueue: Queue,
    @InjectQueue(JobTypes.sms) private readonly smsQueue: Queue,
    @InjectQueue(JobTypes.events)
    private readonly eventsQueue: Queue,
    @InjectModel(Event.name)
    private EventModel: Model<EventDocument>,
    @InjectModel(EventKeys.name)
    private EventKeysModel: Model<EventKeysDocument>,
    @InjectModel(PosthogEventType.name)
    private PosthogEventTypeModel: Model<PosthogEventTypeDocument>,
    @InjectConnection() private readonly connection: mongoose.Connection
  ) {
    for (const { name, property_type } of defaultEventKeys) {
      if (name && property_type) {
        this.EventKeysModel.updateOne(
          { key: name },
          { key: name, type: property_type, providerSpecific: 'posthog' },
          { upsert: true }
        ).exec();
      }
    }
  }

  async correlate(
    account: Account,
    ev: EventsTable
  ): Promise<CustomerDocument> {
    return this.customersService.findByExternalIdOrCreate(
      account,
      ev.userId ? ev.userId : ev.anonymousId
    );
  }

  async correlateCustomEvent(
    account: Account,
    ev: CustomEventTable
  ): Promise<Correlation> {
    return this.customersService.findByCustomEvent(account, ev.slackId);
  }

  async getJobStatus(body: StatusJobDto, type: JobTypes) {
    const jobQueues = {
      [JobTypes.email]: this.emailQueue,
      [JobTypes.slack]: this.slackQueue,
      [JobTypes.sms]: this.smsQueue,
      [JobTypes.events]: this.eventsQueue,
    };

    try {
      const job = await jobQueues[type].getJob(body.jobId);
      const state = await job.getState();
      return state;
    } catch (err) {
      this.logger.error(`Error getting ${type} job status: ` + err);
      throw new HttpException(`Error getting ${type} job status`, 503);
    }
  }

  async getPostHogPayload(apiKey: string, eventDto: PosthogBatchEventDto) {
    const job = await this.eventsQueue.add('posthog', { apiKey, eventDto });

    return job.finished();
  }

  async enginePayload(apiKey: string, eventDto: EventDto) {
    const job = await this.eventsQueue.add('custom', { apiKey, eventDto });

    return job.finished();
  }

  async getOrUpdateAttributes(resourceId: string) {
    const attributes = await this.EventKeysModel.find().exec();
    if (resourceId === 'attributes') {
      return {
        id: resourceId,
        nextResourceURL: 'attributeConditions',
        options: attributes.map((attribute) => ({
          label: attribute.key,
          id: attribute.key,
          nextResourceURL: attribute.key,
        })),
        type: 'select',
      };
    }

    const attribute = attributes.find(
      (attribute) => attribute.key === resourceId
    );
    if (attribute)
      return {
        id: resourceId,
        options: attributeConditions(attribute.type, attribute.isArray),
        type: 'select',
      };

    return (
      mockData.resources.find((resource) => resource.id === resourceId) || {}
    );
  }

  async getAttributes(resourceId: string, providerSpecific?: string) {
    const attributes = await this.EventKeysModel.find({
      key: RegExp(`.*${resourceId}.*`, 'i'),
      providerSpecific,
    })
      .limit(10)
      .exec();

    return attributes.map((el) => ({
      key: el.key,
      type: el.type,
      isArray: el.isArray,
      options: attributeConditions(el.type, el.isArray),
    }));
  }

  async getPossibleTypes() {
    return keyTypes;
  }

  async getPossibleComparisonTypes(type: string, isArray = false) {
    return attributeConditions(type, isArray);
  }

  async getPossibleValues(key: string, search: string) {
    const searchRegExp = new RegExp(`.*${search}.*`, 'i');
    const docs = await this.EventModel.aggregate([
      { $match: { [`event.${key}`]: searchRegExp } },
      { $group: { _id: `$event.${key}` } },
      { $limit: 5 },
    ]).exec();
    return docs.map((doc) => doc?.['event']?.[key]).filter((item) => item);
  }

  async getPossiblePosthogTypes(search = '') {
    const searchRegExp = new RegExp(`.*${search}.*`, 'i');
    const types = await this.PosthogEventTypeModel.find({
      name: searchRegExp,
    })
      .limit(10)
      .exec();
    return types.map((type) => type.name);
  }
}
