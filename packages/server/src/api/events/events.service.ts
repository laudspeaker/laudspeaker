import {
  Injectable,
  Inject,
  Logger,
  HttpException,
  forwardRef,
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
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { EventDocument, Event } from './schemas/event.schema';
import mockData from '../../fixtures/mockData';
import { EventKeys, EventKeysDocument } from './schemas/event-keys.schema';
import { attributeConditions } from '../../fixtures/attributeConditions';
import keyTypes from '../../fixtures/keyTypes';
import { PostHogEventDto } from './dto/posthog-event.dto';
import defaultEventKeys from '../../fixtures/defaultEventKeys';
import {
  PosthogEventType,
  PosthogEventTypeDocument,
} from './schemas/posthog-event-type.schema';
import { WorkflowTick } from '../workflows/interfaces/workflow-tick.interface';
import { DataSource } from 'typeorm';
import posthogEventMappings from '../../fixtures/posthogEventMappings';
import {
  PosthogEvent,
  PosthogEventDocument,
} from './schemas/posthog-event.schema';

@Injectable()
export class EventsService {
  constructor(
    private dataSource: DataSource,
    @Inject(AccountsService) private readonly userService: AccountsService,
    @Inject(forwardRef(() => WorkflowsService))
    private readonly workflowsService: WorkflowsService,
    @Inject(forwardRef(() => CustomersService))
    private readonly customersService: CustomersService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @InjectQueue('message') private readonly messageQueue: Queue,
    @InjectQueue(JobTypes.slack) private readonly slackQueue: Queue,
    @InjectQueue(JobTypes.events)
    private readonly eventsQueue: Queue,
    @InjectModel(Event.name)
    private EventModel: Model<EventDocument>,
    @InjectModel(PosthogEvent.name)
    private PosthogEventModel: Model<PosthogEventDocument>,
    @InjectModel(EventKeys.name)
    private EventKeysModel: Model<EventKeysDocument>,
    @InjectModel(PosthogEventType.name)
    private PosthogEventTypeModel: Model<PosthogEventTypeDocument>,
    @InjectConnection() private readonly connection: mongoose.Connection,
    @InjectQueue('webhooks') private readonly webhooksQueue: Queue
  ) {
    for (const { name, property_type } of defaultEventKeys) {
      if (name && property_type) {
        this.EventKeysModel.updateOne(
          { key: name },
          {
            key: name,
            type: property_type,
            providerSpecific: 'posthog',
            isDefault: true,
          },
          { upsert: true }
        ).exec();
      }
    }
    for (const { name, displayName, type, event } of posthogEventMappings) {
      if (name && displayName && type && event) {
        this.PosthogEventTypeModel.updateOne(
          { name: name },
          {
            name: name,
            displayName: displayName,
            type: type,
            event: event,
            isDefault: true,
          },
          { upsert: true }
        ).exec();
      }
    }
  }

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: EventsService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }
  debug(message, method, session, user = 'ANONYMOUS') {
    this.logger.debug(
      message,
      JSON.stringify({
        class: EventsService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }
  warn(message, method, session, user = 'ANONYMOUS') {
    this.logger.warn(
      message,
      JSON.stringify({
        class: EventsService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }
  error(error, method, session, user = 'ANONYMOUS') {
    this.logger.error(
      error.message,
      error.stack,
      JSON.stringify({
        class: EventsService.name,
        method: method,
        session: session,
        cause: error.cause,
        name: error.name,
        user: user,
      })
    );
  }
  verbose(message, method, session, user = 'ANONYMOUS') {
    this.logger.verbose(
      message,
      JSON.stringify({
        class: EventsService.name,
        method: method,
        session: session,
        user: user,
      })
    );
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

  async getJobStatus(body: StatusJobDto, type: JobTypes, session: string) {
    const jobQueues = {
      [JobTypes.email]: this.messageQueue,
      [JobTypes.slack]: this.slackQueue,
      [JobTypes.events]: this.eventsQueue,
      [JobTypes.webhooks]: this.webhooksQueue,
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

  async getPostHogPayload(
    apiKey: string,
    eventDto: PosthogBatchEventDto,
    session: string
  ) {
    let account: Account, jobIds: WorkflowTick[]; // Account associated with the caller
    const transactionSession = await this.connection.startSession();
    transactionSession.startTransaction();
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    // Step 1: Find corresponding account
    let jobArray: WorkflowTick[] = []; // created jobId
    try {
      account = await this.userService.findOneByAPIKey(apiKey.substring(8));
      this.logger.debug('Found account: ' + account?.id);

      const chronologicalEvents: PostHogEventDto[] = eventDto.batch.sort(
        (a, b) =>
          new Date(a.originalTimestamp).getTime() -
          new Date(b.originalTimestamp).getTime()
      );

      for (
        let numEvent = 0;
        numEvent < chronologicalEvents.length;
        numEvent++
      ) {
        let postHogEvent = new PosthogEvent();
        let err: Error | undefined;
        try {
          const currentEvent = chronologicalEvents[numEvent];
          this.logger.debug(
            'Processing posthog event: ' + JSON.stringify(currentEvent, null, 2)
          );

          postHogEvent = {
            ...postHogEvent,
            name: currentEvent.event,
            type: currentEvent.type,
            payload: JSON.stringify(currentEvent, null, 2),
            ownerId: account.id,
          };

          //update customer properties on every identify call as per best practice
          if (currentEvent.type === 'identify') {
            await this.customersService.phIdentifyUpdate(account, currentEvent);
          }
          //checking for a custom tracked posthog event here
          if (
            currentEvent.type === 'track' &&
            currentEvent.event &&
            currentEvent.event !== 'change' &&
            currentEvent.event !== 'click' &&
            currentEvent.event !== 'submit' &&
            currentEvent.event !== '$pageleave' &&
            currentEvent.event !== '$rageclick'
          ) {
            //checks to see if we have seen this event before (otherwise we update the events dropdown)
            const found = await this.PosthogEventTypeModel.findOne({
              name: currentEvent.event,
              ownerId: account.id,
            })
              .session(transactionSession)
              .exec();
            if (!found) {
              await this.PosthogEventTypeModel.create(
                {
                  name: currentEvent.event,
                  type: currentEvent.type,
                  displayName: currentEvent.event,
                  event: currentEvent.event,
                  ownerId: account.id,
                },
                { session: transactionSession }
              );
            }
            //to do: check if the event sets props, if so we need to update the person traits
          }

          let jobIDs: WorkflowTick[] = [];
          //Step 2: Create/Correlate customer for each eventTemplatesService.queueMessage
          const postHogEventMapping = (event: any) => {
            const cust = {};
            if (event?.phPhoneNumber) {
              cust['phPhoneNumber'] = event.phPhoneNumber;
            }
            if (event?.phEmail) {
              cust['phEmail'] = event.phEmail;
            }
            if (event?.phDeviceToken) {
              cust['phDeviceToken'] = event.phDeviceToken;
            }
            if (event?.phCustom) {
              cust['phCustom'] = event.phCustom;
            }
            return cust;
          };

          const correlation = await this.customersService.findBySpecifiedEvent(
            account,
            'posthogId',
            [currentEvent.userId, currentEvent.anonymousId],
            currentEvent,
            transactionSession,
            postHogEventMapping
          );

          if (!correlation.found) {
            await this.workflowsService.enrollCustomer(
              account,
              correlation.cust,
              queryRunner,
              session
            );
          }
          //need to change posthogeventdto to eventdo
          const convertedEventDto: EventDto = {
            correlationKey: 'posthogId',
            correlationValue: [currentEvent.userId, currentEvent.anonymousId],
            event: currentEvent.context,
            source: 'posthog',
            payload: {
              type: currentEvent.type,
              event: currentEvent.event,
            },
          };

          //currentEvent
          jobIDs = await this.workflowsService.tick(
            account,
            convertedEventDto,
            queryRunner,
            transactionSession,
            session
          );
          this.logger.debug('Queued messages with jobIDs ' + jobIDs);
          jobArray = [...jobArray, ...jobIDs];
        } catch (e) {
          if (e instanceof Error) {
            postHogEvent.errorMessage = e.message;
            err = e;
          }
        } finally {
          await this.PosthogEventModel.create(postHogEvent);
        }
        if (err) throw err;
      }

      await transactionSession.commitTransaction();
      await queryRunner.commitTransaction();
    } catch (e) {
      await transactionSession.abortTransaction();
      await queryRunner.rollbackTransaction();
      this.logger.error('Error 340 processor: ' + e);
      throw e;
    } finally {
      await transactionSession.endSession();
      await queryRunner.release();
    }

    return jobArray;
  }

  async enginePayload(apiKey: string, eventDto: EventDto, session: string) {
    let account: Account, correlation: Correlation, jobIDs: WorkflowTick[];

    const transactionSession = await this.connection.startSession();
    transactionSession.startTransaction();
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      account = await this.userService.findOneByAPIKey(apiKey.substring(8));
      if (!account) this.logger.error('Account not found');
      this.logger.debug('Found Account: ' + account.id);

      correlation = await this.customersService.findOrCreateByCorrelationKVPair(
        account,
        eventDto,
        transactionSession
      );
      this.logger.debug('Correlation result:' + correlation.cust);

      if (!correlation.found)
        await this.workflowsService.enrollCustomer(
          account,
          correlation.cust,
          queryRunner,
          session
        );

      jobIDs = await this.workflowsService.tick(
        account,
        eventDto,
        queryRunner,
        transactionSession,
        session
      );
      this.logger.debug('Queued messages with jobID ' + jobIDs);
      if (eventDto) {
        await this.EventModel.create({
          ...eventDto,
          ownerId: account.id,
          createdAt: new Date().toUTCString(),
        });
      }

      await transactionSession.commitTransaction();
      await queryRunner.commitTransaction();
    } catch (err) {
      await transactionSession.abortTransaction();
      await queryRunner.rollbackTransaction();
      this.logger.error('Error: ' + err);
      throw err;
    } finally {
      await transactionSession.endSession();
      await queryRunner.release();
    }
    return jobIDs;
  }

  async getOrUpdateAttributes(resourceId: string, session: string) {
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

  async getAttributes(
    resourceId: string,
    ownerId: string,
    session: string,
    providerSpecific?: string
  ) {
    const attributes = await this.EventKeysModel.find({
      $and: [
        { key: RegExp(`.*${resourceId}.*`, 'i') },
        { $or: [{ ownerId }, { isDefault: true }] },
      ],
      providerSpecific,
    }).exec();

    return attributes.map((el) => ({
      key: el.key,
      type: el.type,
      isArray: el.isArray,
      options: attributeConditions(el.type, el.isArray),
    }));
  }

  async getPossibleTypes(session: string) {
    return keyTypes;
  }

  async getPossibleComparisonTypes(
    type: string,
    session: string,
    isArray = false
  ) {
    return attributeConditions(type, isArray);
  }

  async getPossibleValues(key: string, search: string, session: string) {
    const searchRegExp = new RegExp(`.*${search}.*`, 'i');
    const docs = await this.EventModel.aggregate([
      { $match: { [`event.${key}`]: searchRegExp } },
      { $group: { _id: `$event.${key}` } },
      { $limit: 5 },
    ]).exec();
    return docs.map((doc) => doc?.['event']?.[key]).filter((item) => item);
  }

  async getPossiblePosthogTypes(ownerId: string, session: string, search = '') {
    const searchRegExp = new RegExp(`.*${search}.*`, 'i');
    // TODO: need to recheck, filtering not working in a correct way
    const types = await this.PosthogEventTypeModel.find({
      $and: [
        { name: searchRegExp },
        { $or: [{ ownerId }, { isDefault: true }] },
      ],
    }).exec();
    return types.map((type) => type.displayName);
  }

  async getPosthogEvents(
    account: Account,
    session: string,
    take = 100,
    skip = 0,
    search = ''
  ) {
    const searchRegExp = new RegExp(`.*${search}.*`, 'i');

    const totalPages =
      Math.ceil(
        (await this.PosthogEventModel.count({
          name: searchRegExp,
          ownerId: (<Account>account).id,
        }).exec()) / take
      ) || 1;

    const posthogEvents = await this.PosthogEventModel.find({
      name: searchRegExp,
      ownerId: (<Account>account).id,
    })
      .sort({ createdAt: 'desc' })
      .skip(skip)
      .limit(take > 100 ? 100 : take)
      .exec();

    return {
      data: posthogEvents.map((posthogEvent) => ({
        ...posthogEvent.toObject(),
        createdAt: posthogEvent._id.getTimestamp(),
      })),
      totalPages,
    };
  }
}
