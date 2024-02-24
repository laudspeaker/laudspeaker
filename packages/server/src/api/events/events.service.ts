import {
  Injectable,
  Inject,
  Logger,
  HttpException,
  forwardRef,
  HttpStatus,
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
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { StatusJobDto } from './dto/status-event.dto';
import {
  Processor,
  WorkerHost,
  OnWorkerEvent,
  InjectQueue,
} from '@nestjs/bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Job, Queue, UnrecoverableError } from 'bullmq';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { ClientSession, Model } from 'mongoose';
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
import { DataSource } from 'typeorm';
import posthogEventMappings from '../../fixtures/posthogEventMappings';
import {
  PosthogEvent,
  PosthogEventDocument,
} from './schemas/posthog-event.schema';
import { JourneysService } from '../journeys/journeys.service';
import admin from 'firebase-admin';
import { Journey } from '../journeys/entities/journey.entity';
import { CustomerPushTest } from './dto/customer-push-test.dto';
import {
  PlatformSettings,
  PushPlatforms,
} from '../templates/entities/template.entity';
import { Workspace } from '../workspaces/entities/workspace.entity';
import { ProviderType } from './events.preprocessor';

@Injectable()
export class EventsService {
  constructor(
    private dataSource: DataSource,
    @Inject(forwardRef(() => CustomersService))
    private readonly customersService: CustomersService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @InjectQueue('message') private readonly messageQueue: Queue,
    @InjectQueue('events') private readonly eventQueue: Queue,
    @InjectQueue('events_pre')
    private readonly eventPreprocessorQueue: Queue,
    @InjectQueue(JobTypes.slack) private readonly slackQueue: Queue,
    @InjectQueue(JobTypes.events)
    private readonly eventsQueue: Queue,
    @InjectModel(Event.name)
    private EventModel: Model<EventDocument>,
    @InjectModel(PosthogEvent.name)
    private PosthogEventModel: Model<PosthogEventDocument>,
    @InjectModel(EventKeys.name)
    private EventKeysModel: Model<EventKeysDocument>,
    @InjectRepository(Account)
    public accountsRepository: Repository<Account>,
    @InjectModel(PosthogEventType.name)
    private PosthogEventTypeModel: Model<PosthogEventTypeDocument>,
    @InjectConnection() private readonly connection: mongoose.Connection,
    @InjectQueue('webhooks') private readonly webhooksQueue: Queue,
    @Inject(forwardRef(() => JourneysService))
    private readonly journeysService: JourneysService
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

  async posthogPayload(
    account: Account,
    eventDto: PosthogBatchEventDto,
    session: string
  ) {
    let err: any;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await queryRunner.manager.save(Account, {
        id: account.id,
        posthogSetupped: true,
      });

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
        await this.eventPreprocessorQueue.add(
          'posthog',
          {
            account: account,
            event: eventDto,
            session: session,
          },
          {
            attempts: 10,
            backoff: { delay: 1000, type: 'exponential' },
          }
        );
      }
    } catch (e) {
      await queryRunner.rollbackTransaction();
      err = e;
    } finally {
      await queryRunner.release();
      if (err) throw err;
    }
  }

  async customPayload(
    auth: { account: Account; workspace: Workspace },
    eventDto: EventDto,
    session: string
  ) {
    await this.eventPreprocessorQueue.add(ProviderType.LAUDSPEAKER, {
      owner: auth.account,
      workspace: auth.workspace,
      event: eventDto,
      session: session,
    });
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
    const account = await this.accountsRepository.findOne({
      where: { id: ownerId },
      relations: ['teams.organization.workspaces'],
    });
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    const attributes = await this.EventKeysModel.find({
      $and: [
        { key: RegExp(`.*${resourceId}.*`, 'i') },
        { $or: [{ workspaceId: workspace.id }, { isDefault: true }] },
      ],
      providerSpecific,
    }).exec();

    return attributes.map((el) => ({
      id: el.id,
      key: el.key,
      type: el.type,
      isArray: el.isArray,
      options: attributeConditions(el.type, el.isArray),
    }));
  }

  async getPossibleEventNames(account: Account, search: string) {
    account = await this.accountsRepository.findOne({
      where: { id: account.id },
      relations: ['teams.organization.workspaces'],
    });
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    const eventNames = await this.EventModel.find({
      $and: [
        { workspaceId: workspace.id },
        { event: RegExp(`.*${search}.*`, 'i') },
      ],
    })
      .distinct('event')
      .exec();

    return eventNames;
  }

  async getPossibleEventProperties(
    account: Account,
    event: string,
    search: string
  ) {
    account = await this.accountsRepository.findOne({
      where: { id: account.id },
      relations: ['teams.organization.workspaces'],
    });
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    const records = await this.EventModel.find({
      $and: [{ workspaceId: workspace.id }, { event }],
    }).exec();

    if (records.length === 0) return [];

    const uniqueProperties: string[] = records
      .map((record) => Object.keys(record.payload))
      .reduce((acc, el) => [...acc, ...el])
      .reduce((acc, el) => (acc.includes(el) ? acc : [...acc, el]), []);

    return uniqueProperties.filter((property) =>
      property.match(RegExp(`.*${search}.*`, 'i'))
    );
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

  /*
   *
   * Retrieves a number of events for the user to see in the event tracker
   * uses mongo aggregation
   */
  async getCustomEvents(
    account: Account,
    session: string,
    take = 100,
    skip = 0,
    search = ''
  ) {
    this.debug(
      ` in customEvents`,
      this.getCustomEvents.name,
      session,
      account.id
    );

    //console.log("in customEvents")
    const searchRegExp = new RegExp(`.*${search}.*`, 'i');
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    const totalPages =
      Math.ceil(
        (await this.EventModel.count({
          event: searchRegExp,
          workspaceId: workspace.id,
          //ownerId: (<Account>account).id,
        }).exec()) / take
      ) || 1;

    //console.log("regex", searchRegExp );
    //console.log("ownderId", (<Account>account).id );

    /*
    const customEvents = await this.EventModel.find({
      event: searchRegExp,
      ownerId: (<Account>account).id,
    }, {
      ownerId: 0, // Exclude the ownerId field
      __v: 0 // Exclude the __v (version key) field
    })
      .sort({ createdAt: 'desc' })
      .skip(skip)
      .limit(take > 100 ? 100 : take)
      .exec();
    */
    const customEvents = await this.EventModel.aggregate([
      {
        $match: {
          event: searchRegExp,
          workspaceId: workspace.id,
          //ownerId: (<Account>account).id,
        },
      },
      {
        $addFields: {
          createdAt: { $toDate: '$_id' }, // Convert _id to a date and assign to createdAt
        },
      },
      {
        $project: {
          _id: 0, // Exclude the _id field
          ownerId: 0, // Exclude the ownerId field
          workspaceId: 0, // Exclude the ownerId field
          __v: 0, // Exclude the __v field
          // Note: No need to explicitly include other fields; they are included by default
        },
      },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: take > 100 ? 100 : take },
    ]).exec();

    return {
      /*
      data: customEvents.map((customEvent) => ({
        ...customEvent.toObject(),
        //createdAt: customEvent._id.getTimestamp(),
        createdAt: customEvent._id.getTimestamp(),
        
      })),
      */
      data: customEvents.map((customEvent) => {
        const cleanedEvent = {
          ...customEvent,
          // Perform any additional transformations here if necessary
        };
        return cleanedEvent;
      }),
      totalPages,
    };
  }

  //to do need to specify how this is
  async getEventsByMongo(mongoQuery: any, customer: CustomerDocument) {
    //console.log("In getEvents by mongo");

    const tehevents = await this.EventModel.find(mongoQuery).exec();
    //console.log("events are", JSON.stringify(tehevents, null, 2))

    //console.log("events are", JSON.stringify(await this.EventModel.find(mongoQuery).exec(),null, 2));
    const count = await this.EventModel.count(mongoQuery).exec();
    //console.log("count is", count);
    return count;
  }

  //to do need to specify how this is
  async getCustomersbyEventsMongo(
    aggregationPipeline: any
    //externalId: boolean,
    //numberOfTimes: Number,
  ) {
    //console.log("In getCustomersbyEventsMongo by mongo");

    const docs = await this.EventModel.aggregate(aggregationPipeline).exec();

    return docs;
  }

  async sendTestPush(account: Account, token: string) {
    const foundAcc = await this.accountsRepository.findOne({
      where: {
        id: account.id,
      },
      relations: ['teams.organization.workspaces'],
    });

    const workspace = foundAcc.teams?.[0]?.organization?.workspaces?.[0];

    const hasConnected = Object.values(workspace.pushPlatforms).some(
      (el) => !!el
    );

    try {
      if (!hasConnected) {
        throw new HttpException(
          "You don't have platform's connected",
          HttpStatus.NOT_ACCEPTABLE
        );
      }

      await Promise.all(
        Object.keys(workspace.pushPlatforms)
          .filter((el) => !!workspace.pushPlatforms[el])
          .map(async (el) => {
            if (workspace.pushPlatforms[el].credentials) {
              let firebaseApp: admin.app.App;

              try {
                firebaseApp = admin.app(foundAcc.id + ';;' + el);
              } catch (e: any) {
                if (e.code == 'app/no-app') {
                  firebaseApp = admin.initializeApp(
                    {
                      credential: admin.credential.cert(
                        workspace.pushPlatforms[el].credentials
                      ),
                    },
                    `${foundAcc.id};;${el}`
                  );
                } else {
                  throw new HttpException(
                    `Error while using credentials for ${el}.`,
                    HttpStatus.FAILED_DEPENDENCY
                  );
                }
              }

              const messaging = admin.messaging(firebaseApp);

              await messaging.send({
                token: token,
                notification: {
                  title: `Laudspeaker ${el} test`,
                  body: 'Testing push notifications',
                },
                android: {
                  notification: {
                    sound: 'default',
                  },
                },
                apns: {
                  payload: {
                    aps: {
                      badge: 1,
                      sound: 'default',
                    },
                  },
                },
              });
            }
          })
      );
    } catch (e) {
      throw e;
    }
  }

  async sendTestPushByCustomer(account: Account, body: CustomerPushTest) {
    const foundAcc = await this.accountsRepository.findOne({
      where: {
        id: account.id,
      },
      relations: ['teams.organization.workspaces'],
    });

    const workspace = foundAcc.teams?.[0]?.organization?.workspaces?.[0];

    const hasConnected = Object.values(workspace.pushPlatforms).some(
      (el) => !!el
    );

    try {
      if (!hasConnected) {
        throw new HttpException(
          "You don't have platform's connected",
          HttpStatus.NOT_ACCEPTABLE
        );
      }

      const customer = await this.customersService.findById(
        account,
        body.customerId
      );

      if (!customer.androidDeviceToken && !customer.iosDeviceToken) {
        throw new HttpException(
          "Selected customer don't have androidDeviceToken nor iosDeviceToken.",
          HttpStatus.NOT_ACCEPTABLE
        );
      }

      await Promise.all(
        Object.entries(body.pushObject.platform)
          .filter(
            ([platform, isEnabled]) =>
              isEnabled && workspace.pushPlatforms[platform]
          )
          .map(async ([platform]) => {
            if (!workspace.pushPlatforms[platform]) {
              throw new HttpException(
                `Platform ${platform} is not connected.`,
                HttpStatus.NOT_ACCEPTABLE
              );
            }

            if (
              platform === PushPlatforms.ANDROID &&
              !customer.androidDeviceToken
            ) {
              this.logger.warn(
                `Customer ${body.customerId} don't have androidDeviceToken property to test push notification. Skipping.`
              );
              return;
            }

            if (platform === PushPlatforms.IOS && !customer.iosDeviceToken) {
              this.logger.warn(
                `Customer ${body.customerId} don't have iosDeviceToken property to test push notification. Skipping.`
              );
              return;
            }

            const settings: PlatformSettings =
              body.pushObject.settings[platform];
            let firebaseApp;
            try {
              firebaseApp = admin.app(foundAcc.id + ';;' + platform);
            } catch (e: any) {
              if (e.code == 'app/no-app') {
                firebaseApp = admin.initializeApp(
                  {
                    credential: admin.credential.cert(
                      workspace.pushPlatforms[platform].credentials
                    ),
                  },
                  `${foundAcc.id};;${platform}`
                );
              } else {
                throw new HttpException(
                  `Error while using credentials for ${platform}.`,
                  HttpStatus.FAILED_DEPENDENCY
                );
              }
            }

            const messaging = admin.messaging(firebaseApp);
            await messaging.send({
              token:
                platform === PushPlatforms.ANDROID
                  ? customer.androidDeviceToken
                  : customer.iosDeviceToken,
              notification: {
                title: settings.title,
                body: settings.description,
              },
              android:
                platform === PushPlatforms.ANDROID
                  ? {
                      notification: {
                        sound: 'default',
                        imageUrl: settings?.image?.imageSrc,
                      },
                    }
                  : undefined,
              apns:
                platform === PushPlatforms.IOS
                  ? {
                      payload: {
                        aps: {
                          badge: 1,
                          sound: 'default',
                          category: settings.clickBehavior?.type,
                          contentAvailable: true,
                          mutableContent: true,
                        },
                      },
                      fcmOptions: {
                        imageUrl: settings?.image?.imageSrc,
                      },
                    }
                  : undefined,
              data: body.pushObject.fields.reduce((acc, field) => {
                acc[field.key] = field.value;
                return acc;
              }, {}),
            });
          })
      );
    } catch (e) {
      throw e;
    }
  }
}
