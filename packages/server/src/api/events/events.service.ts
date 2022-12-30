import {
  Injectable,
  Inject,
  LoggerService,
  HttpException,
} from '@nestjs/common';
import { Correlation, CustomersService } from '../customers/customers.service';
import { CustomerDocument } from '../customers/schemas/customer.schema';
import { EventsTable, CustomEventTable } from './interfaces/event.interface';
import { Account } from '../accounts/entities/accounts.entity';
import { PosthogBatchEventDto } from './dto/posthog-batch-event.dto';
import { EventDto } from './dto/event.dto';
import { AccountsService } from '../accounts/accounts.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { WorkflowTick } from '../workflows/interfaces/workflow-tick.interface';
import { Eventtype, PostHogEventDto } from './dto/posthog-event.dto';
import { StatusJobDto } from './dto/status-event.dto';
import { Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
import { PosthogTriggerParams } from '../workflows/entities/workflow.entity';

@Injectable()
export class EventsService {
  constructor(
    @Inject(AccountsService) private readonly userService: AccountsService,
    @Inject(WorkflowsService)
    private readonly workflowsService: WorkflowsService,
    @Inject(CustomersService)
    private readonly customersService: CustomersService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectQueue('email') private readonly emailQueue: Queue,
    @InjectQueue('slack') private readonly slackQueue: Queue,
    @InjectModel(Event.name)
    private EventModel: Model<EventDocument>,
    @InjectModel(EventKeys.name)
    private EventKeysModel: Model<EventKeysDocument>,
    @InjectModel(PosthogEventType.name)
    private PosthogEventTypeModel: Model<PosthogEventTypeDocument>
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

  async getJobEmailStatus(body: StatusJobDto) {
    try {
      const emailJob = await this.emailQueue.getJob(body.jobId);
      const state = await emailJob.getState();
      return state;
    } catch (err) {
      this.logger.error('Error getting email job status: ' + err);
      throw new HttpException('Error getting email job status', 503);
    }
  }

  async getJobSlackStatus(body: StatusJobDto) {
    try {
      const slackJob = await this.slackQueue.getJob(body.jobId);
      const state = await slackJob.getState();
      return state;
    } catch (err) {
      this.logger.error('Error getting slack job status: ' + err);
      throw new HttpException('Error getting slack job status', 503);
    }
  }

  async getPostHogPayload(apiKey: string, body: PosthogBatchEventDto) {
    let account: Account, jobIds: WorkflowTick[]; // Account associated with the caller
    // Step 1: Find corresponding account
    try {
      account = await this.userService.findOneByAPIKey(apiKey.substring(8));
      this.logger.debug('Found account: ' + account.id);
    } catch (e) {
      this.logger.error('Error: ' + e);
      return new HttpException(e, 500);
    }

    let jobArray: WorkflowTick[] = []; // created jobId

    const chronologicalEvents: PostHogEventDto[] = body.batch.sort(
      (a, b) =>
        new Date(a.originalTimestamp).getTime() -
        new Date(b.originalTimestamp).getTime()
    );

    try {
      for (
        let numEvent = 0;
        numEvent < chronologicalEvents.length;
        numEvent++
      ) {
        const currentEvent = chronologicalEvents[numEvent];
        this.logger.debug(
          'Processing posthog event: ' + JSON.stringify(currentEvent, null, 2)
        );

        if (
          currentEvent.type === 'track' &&
          currentEvent.event &&
          currentEvent.event !== 'clicked'
        ) {
          const found = await this.PosthogEventTypeModel.findOne({
            name: currentEvent.event,
          }).exec();
          if (!found) {
            await this.PosthogEventTypeModel.create({
              name: currentEvent.event,
            });
          }
        }

        let jobIDs: WorkflowTick[] = [];
        let cust: CustomerDocument, // Customer document created/found on this API call
          found: boolean; // If the customer document was previously created
        //Step 2: Create/Correlate customer for each eventTemplatesService.queueMessage
        try {
          const postHogEventMapping = (event: any) => {
            const cust = {};
            if (event?.phPhoneNumber) {
              cust['phPhoneNumber'] = event.phPhoneNumber;
            }
            if (event?.phEmail) {
              cust['phEmail'] = event.phEmail;
            }
            if (event?.phCustom) {
              cust['phCustom'] = event.phCustom;
            }
            return cust;
          };
          const correlation = await this.customersService.findBySpecifiedEvent(
            account,
            'posthogId',
            currentEvent.userId,
            currentEvent,
            postHogEventMapping
          );
          cust = correlation.cust;
          found = correlation.found;

          if (!correlation.found) {
            try {
              await this.workflowsService.enrollCustomer(
                account,
                correlation.cust
              );
            } catch (err) {
              this.logger.error('Error: ' + err);
              return new HttpException(err, 500);
            }
          }
          //need to change posthogeventdto to eventdo
          const convertedEventDto: EventDto = {
            correlationKey: 'posthogId',
            correlationValue: currentEvent.userId,
            event: currentEvent.context,
            source: 'posthog',
            payload: {
              type: currentEvent.type,
              event: currentEvent.event,
            },
          };

          //currentEvent
          try {
            jobIDs = await this.workflowsService.tick(
              account,
              convertedEventDto
            );
            this.logger.debug('Queued messages with jobIDs ' + jobIDs);
          } catch (err) {
            this.logger.error('Error: ' + err);
            return new HttpException(err, 500);
          }
        } catch (e) {
          this.logger.error('Error: ' + e);
          return new HttpException(e, 500);
        }
        jobArray = [...jobArray, ...jobIDs];
      }
    } catch (e) {
      this.logger.error('Error: ' + e);
      return new HttpException(e, 500);
    }
    return jobArray;
  }

  async enginePayload(apiKey: string, body: EventDto) {
    let account: Account, correlation: Correlation, jobIDs: WorkflowTick[];
    try {
      account = await this.userService.findOneByAPIKey(apiKey.substring(8));
      if (!account) this.logger.error('Account not found');
      this.logger.debug('Found Account: ' + account.id);
    } catch (err) {
      this.logger.error('Error: ' + err);
      return new HttpException(err, 500);
    }
    try {
      correlation = await this.customersService.findOrCreateByCorrelationKVPair(
        account,
        body
      );
      this.logger.debug('Correlation result:' + correlation.cust);
    } catch (err) {
      this.logger.error('Error: ' + err);
      return new HttpException(err, 500);
    }
    if (!correlation.found) {
      try {
        await this.workflowsService.enrollCustomer(account, correlation.cust);
      } catch (err) {
        this.logger.error('Error: ' + err);
        return new HttpException(err, 500);
      }
    }
    try {
      jobIDs = await this.workflowsService.tick(account, body);
      this.logger.debug('Queued messages with jobID ' + jobIDs);
      if (body) {
        await this.EventModel.create({
          ...body,
          createdAt: new Date().toUTCString(),
        });
      }
      console.log(jobIDs);
      return jobIDs;
    } catch (err) {
      this.logger.error('Error: ' + err);
      return new HttpException(err, 500);
    }
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
