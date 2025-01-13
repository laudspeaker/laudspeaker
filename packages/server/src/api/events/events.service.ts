import {
  Injectable,
  Inject,
  Logger,
  HttpException,
  forwardRef,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { CustomersService } from '../customers/customers.service';
import {
  JobTypes,
} from './interfaces/event.interface';
import { Account } from '../accounts/entities/accounts.entity';
import { PosthogBatchEventDto } from './dto/posthog-batch-event.dto';
import { EventDto } from './dto/event.dto';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { StatusJobDto } from './dto/status-event.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import mockData from '../../fixtures/mockData';
import { attributeConditions } from '../../fixtures/attributeConditions';
import keyTypes from '../../fixtures/keyTypes';
import { PostHogEventDto } from './dto/posthog-event.dto';
import defaultEventKeys from '../../fixtures/defaultEventKeys';
import { DataSource } from 'typeorm';
import posthogEventMappings from '../../fixtures/posthogEventMappings';
import { JourneysService } from '../journeys/journeys.service';
import admin from 'firebase-admin';
import { CustomerPushTest } from './dto/customer-push-test.dto';
import {
  PlatformSettings,
  PushPlatforms,
} from '../templates/entities/template.entity';
import { Workspaces } from '../workspaces/entities/workspaces.entity';
import { ProviderType } from './processors/events.preprocessor';
import { SendFCMDto } from './dto/send-fcm.dto';
import { IdentifyCustomerDTO } from './dto/identify-customer.dto';
import { SetCustomerPropsDTO } from './dto/set-customer-props.dto';
import { BatchEventDto } from './dto/batch-event.dto';
import e from 'express';
import { WebhooksService } from '../webhooks/webhooks.service';
import { Liquid } from 'liquidjs';
import { cleanTagsForSending } from '../../shared/utils/helpers';
import { randomUUID } from 'crypto';
import * as Sentry from '@sentry/node';
import { FindType } from '../customers/enums/FindType.enum';
import { QueueType } from '../../common/services/queue/types/queue-type';
import { Producer } from '../../common/services/queue/classes/producer';
import { ClickHouseEventProvider } from '../../common/services/clickhouse/types/clickhouse-event-provider';
import { ClickHouseMessage } from '../../common/services/clickhouse/interfaces/clickhouse-message';
import { Customer } from '../customers/entities/customer.entity';
import { CustomerKeysService } from '../customers/customer-keys.service';
import { AttributeTypeName } from '../customers/entities/attribute-type.entity';
import { ClickHouseClient, ClickHouseEvent, ClickHouseEventSource, ClickHouseTable } from '../../common/services/clickhouse';
import { NodeFactory, Query, QuerySyntax } from '../../common/services/query';

@Injectable()
export class EventsService {
  private tagEngine = new Liquid();

  constructor(
    private dataSource: DataSource,
    @Inject(forwardRef(() => CustomersService))
    private readonly customersService: CustomersService,
    @Inject(forwardRef(() => CustomerKeysService))
    private readonly customerKeysService: CustomerKeysService,
    @Inject(forwardRef(() => WebhooksService))
    private readonly webhooksService: WebhooksService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @InjectRepository(Account)
    public accountsRepository: Repository<Account>,
    @Inject(forwardRef(() => JourneysService))
    private readonly journeysService: JourneysService,
    @Inject(ClickHouseClient)
    private clickhouseClient: ClickHouseClient,
  ) {
    this.tagEngine.registerTag('api_call', {
      parse(token) {
        this.items = token.args.split(' ');
      },
      async render(ctx) {
        const url = this.liquid.parseAndRenderSync(
          this.items[0],
          ctx.getAll(),
          ctx.opts
        );

        try {
          const res = await fetch(url, { method: 'GET' });

          if (res.status !== 200)
            throw new Error('Error while processing api_call tag');

          const data = res.headers
            .get('Content-Type')
            .includes('application/json')
            ? await res.json()
            : await res.text();

          if (this.items[1] === ':save' && this.items[2]) {
            ctx.push({ [this.items[2]]: data });
          }
        } catch (e) {
          throw new Error('Error while processing api_call tag');
        }
      },
    });

    const session = randomUUID();
    (async () => {
      try {
      } catch (e) {
        this.error(e, EventsService.name, session);
      }
    })();
    for (const { name, property_type } of defaultEventKeys) {
      if (name && property_type) {
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

  async getJobStatus(body: StatusJobDto, type: JobTypes, session: string) {
    throw Error("Deprecated")
    // const jobQueues = {
    //   [JobTypes.email]: this.messageQueue,
    //   [JobTypes.slack]: this.slackQueue,
    //   [JobTypes.events]: this.eventQueue,
    //   [JobTypes.webhooks]: this.webhooksQueue,
    // };

    // try {
    //   const job = await jobQueues[type].getJob(body.jobId);
    //   const state = await job.getState();
    //   return state;
    // } catch (err) {
    //   this.logger.error(`Error getting ${type} job status: ` + err);
    //   throw new HttpException(`Error getting ${type} job status`, 503);
    // }
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
        await Producer.add(QueueType.EVENTS_PRE, {
          account: account,
          event: eventDto,
          session: session,
        }, 'posthog');
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
    auth: { account: Account; workspace: Workspaces },
    eventDto: EventDto,
    session: string
  ) {
    const jobData = {
      owner: auth.account,
      workspace: auth.workspace,
      event: eventDto,
      session: session,
    };

    await Producer.add(QueueType.EVENTS_PRE, jobData, ProviderType.LAUDSPEAKER)
  }

  async getOrUpdateAttributes(resourceId: string, session: string) {
    if (resourceId === 'attributes') {
      return {};
    }
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

    return [];
  }

  async getPossibleEventNames(account: Account, search: string) {
    account = await this.accountsRepository.findOne({
      where: { id: account.id },
      relations: ['teams.organization.workspaces'],
    });
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    return [];
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

    
    return [];
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
    return [];
  }

  /*
   *
   * Retrieves a number of events for the user to see in the event tracker
   */
  async getCustomEvents(
    account: Account,
    session: string,
    take = 100,
    search = '',
    anchor = '',
    id = '',
    lastPageId = ''
  ) {

    return Sentry.startSpan(
      { name: 'EventsService.getCustomEvents' },
      async () => {
        const result = await this.getCustomEventsCursorSearch(
          account,
          session,
          take,
          search,
          anchor,
          id,
          lastPageId
        );

        return result;
      }
    );
  }

  async getCustomEventsCursorSearch(
    account: Account,
    session: string,
    pageSize: number,
    search: string,
    anchor: string,
    cursorEventId: string,
    lastPageId: string
  ) {
    let direction;
    // anchor options: first_page, previous, next, last_page
    // direction: 1 or -1. 1 means we're going to the next page, -1 means previous
    // cursorEventId is the event id we need to search after or before, depending
    // on the direction
    ({ anchor, direction, cursorEventId } =
      this.computeCustomEventsQueryVariables(anchor, direction, cursorEventId));
    const { query } = this.prepareCustomEventsQuery(
      account,
      pageSize,
      search,
      anchor,
      direction,
      cursorEventId
    );

    const customEvents = await this.executeCustomEventsQuery(query);

    var resultSetHasMoreThanPageSize = false;

    // since we always fetch pageSize + 1 events, pop the last element in the resultset
    if (customEvents.length > pageSize) {
      customEvents.pop();
      resultSetHasMoreThanPageSize = true;
    }

    // if we're going the reverse direction (direction == -1 / previous page)
    // we need to reverse the customEvents array so we have the most recent
    // event at the top
    if (direction == -1) {
      customEvents.reverse();
    }

    var showNext =
      (direction == 1 && resultSetHasMoreThanPageSize) ||
      (direction == -1 && anchor == 'previous');
    var showPrev =
      (direction == -1 && resultSetHasMoreThanPageSize) ||
      (direction == 1 && anchor == 'next');
    var showLast =
      (anchor == 'first_page' && resultSetHasMoreThanPageSize) ||
      anchor != 'last_page' ||
      (direction == 1 && resultSetHasMoreThanPageSize);

    var showNextCursorEventId = '';
    var showPrevCursorEventId = '';

    if (showNext)
      showNextCursorEventId = customEvents[customEvents.length - 1].id;

    if (showPrev) showPrevCursorEventId = customEvents[0].id;

    const filteredCustomEvents =
      this.filterCustomEventsAttributes(customEvents);

    const result = {
      data: filteredCustomEvents,
      showPrev: showPrev,
      showNext: showNext,
      showPrevCursorEventId: showPrevCursorEventId,
      showNextCursorEventId: showNextCursorEventId,
      showLast: showLast,
      anchor: anchor,
    };

    return result;
  }

  computeCustomEventsQueryVariables(
    anchor: string,
    direction: number,
    cursorEventId: string
  ) {
    // initial load of events_tracker page
    if (cursorEventId == '' && anchor == '') {
      anchor = 'first_page';
    }

    if (anchor == 'first_page') {
      direction = 1;
      cursorEventId = '';
    } else if (anchor == 'last_page') {
      direction = -1;
      cursorEventId = '';
    } else if (anchor == 'next') {
      direction = 1;
    } else if (anchor == 'previous') {
      direction = -1;
    }

    return { anchor, direction, cursorEventId };
  }

  prepareCustomEventsQuery(
    account: Account,
    pageSize: number,
    search: string,
    anchor: string,
    direction: number,
    cursorEventId: string
  ) {
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    let filter = `workspace_id = '${workspace.id}'`;

    if (search !== '') {
      filter += ` AND event ILIKE '%${search}%'`;
    }

    let sort = 'ORDER BY id DESC';
    let cursorCondition = '';

    if (direction == 1) {
      if (cursorEventId != '')
        cursorCondition = ` AND id < ${cursorEventId}`;
    } else {
      if (cursorEventId != '')
        cursorCondition = ` AND id > ${cursorEventId}`;
      sort = 'ORDER BY id ASC';
    }

    const limit = pageSize + 1;

    const query = `
      SELECT *
      FROM events
      WHERE ${filter}${cursorCondition}
      ${sort}
      LIMIT ${limit}
    `;

    return { query };
  }


  async executeCustomEventsQuery(query: string) {
    const result = await this.clickhouseClient.query({ query });
    const events = await result.json<any>();
    const parsedResult = this.parseCustomEventsQueryResult(events.data);
    return parsedResult;
  }

  parseCustomEventsQueryResult(result) {
    for (var i = 0; i < result.length; i++) {
      result[i].id = result[i].id.toString();
    }

    return result;
  }


  filterCustomEventsAttributes(customEvents) {
    const attributesToRemove = ['id', 'workspaceId'];

    for (const attribute of attributesToRemove) {
      for (var i = 0; i < customEvents.length; i++) {
        delete customEvents[i][attribute];
      }
    }

    return customEvents;
  }

  //to do need to specify how this is
  async getEventsByMongo(mongoQuery: any, customer: Customer) {
    return 0;
  }

  //to do need to specify how this is
  async getCustomersbyEventsMongo(
    aggregationPipeline: any
    //externalId: boolean,
    //numberOfTimes: Number,
  ) {

    return [];
  }

  async sendTestPush(account: Account, token: string) {
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

    const hasConnected = Object.values(workspace.pushPlatforms).some(
      (el) => !!el
    );

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
              firebaseApp = admin.app(account.id + ';;' + el);
            } catch (e: any) {
              if (e.code == 'app/no-app') {
                firebaseApp = admin.initializeApp(
                  {
                    credential: admin.credential.cert(
                      workspace.pushPlatforms[el].credentials
                    ),
                  },
                  `${account.id};;${el}`
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
                priority: 'high',
              },
              apns: {
                headers: {
                  'apns-priority': '5',
                },
                payload: {
                  aps: {
                    badge: 1,
                    sound: 'default',
                  },
                },
              },
            });
            // await messaging.send({
            //   token: token,
            //   data: {
            //     title: `Laudspeaker ${el} test`,
            //     body: 'Testing push notifications',
            //     sound: 'default',
            //     badge: '1',
            //   },
            //   android: {
            //     priority: 'high'
            //   },
            //   apns: {
            //     headers: {
            //       'apns-priority': '5',
            //     },
            //     payload: {
            //       aps: {
            //         contentAvailable: true,
            //       },
            //     },
            //   },
            // });
          }
        })
    );
  }

  async sendFCMToken(
    auth: { account: Account; workspace: Workspaces },
    body: SendFCMDto,
    session: string
  ) {
    if (!body.type)
      throw new HttpException('No type given', HttpStatus.BAD_REQUEST);
    if (!body.token)
      throw new HttpException('No FCM token given', HttpStatus.BAD_REQUEST);

    const organization = auth.account.teams[0].organization;
    const workspace = auth.workspace;

    let customer = await this.customersService.findByCustomerId(auth.account, body.customerId);

    if (!customer) {
      this.warn('Customer not found, creating anonymous customer', this.sendFCMToken.name, session);

      await this.customersService.checkCustomerLimit(organization);

      customer = await this.customersService.createAnonymous(auth.account);
    }

    await this.customersService.updateCustomer(auth.account, customer.id, 'user_attributes',
      {
        [body.type === PushPlatforms.ANDROID
          ? 'androidDeviceToken'
          : 'iosDeviceToken']: body.token,
      },
      session
    );

    return customer.id;
  }

  async sendTestPushByCustomer(account: Account, body: CustomerPushTest) {
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

    const hasConnected = Object.values(workspace.pushPlatforms).some(
      (el) => !!el
    );

    if (!hasConnected) {
      throw new HttpException(
        "You don't have platform's connected",
        HttpStatus.NOT_ACCEPTABLE
      );
    }

    const customer = await this.customersService.findByCustomerId(
      account,
      body.customerId
    );

    const androidDeviceToken = customer?.getUserAttribute('androidDeviceToken');
    const iosDeviceToken = customer?.getUserAttribute('iosDeviceToken');

    if (!androidDeviceToken && !iosDeviceToken) {
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
            !androidDeviceToken
          ) {
            this.logger.warn(
              `Customer ${body.customerId} don't have androidDeviceToken property to test push notification. Skipping.`
            );
            return;
          }

          if (platform === PushPlatforms.IOS && !iosDeviceToken) {
            this.logger.warn(
              `Customer ${body.customerId} don't have iosDeviceToken property to test push notification. Skipping.`
            );
            return;
          }

          const settings: PlatformSettings = body.pushObject.settings[platform];
          let firebaseApp;
          try {
            firebaseApp = admin.app(account.id + ';;' + platform);
          } catch (e: any) {
            if (e.code == 'app/no-app') {
              firebaseApp = admin.initializeApp(
                {
                  credential: admin.credential.cert(
                    workspace.pushPlatforms[platform].credentials
                  ),
                },
                `${account.id};;${platform}`
              );
            } else {
              throw new HttpException(
                `Error while using credentials for ${platform}.`,
                HttpStatus.FAILED_DEPENDENCY
              );
            }
          }

          // const { _id, workspaceId, workflows, ...tags } = customer.toObject();
          const filteredTags = null; //cleanTagsForSending(tags);

          const messaging = admin.messaging(firebaseApp);

          try {
            await messaging.send({
              token:
                platform === PushPlatforms.ANDROID
                  ? androidDeviceToken
                  : iosDeviceToken,
              notification: {
                title: await this.tagEngine.parseAndRender(
                  settings.title,
                  filteredTags || {},
                  {
                    strictVariables: true,
                  }
                ),
                body: await this.tagEngine.parseAndRender(
                  settings.description,
                  filteredTags || {},
                  {
                    strictVariables: true,
                  }
                ),
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
          } catch (e) {
            if (e instanceof Error) {
              throw new BadRequestException(e.message);
            }
          }
        })
    );
  }

  async batch(
    auth: { account: Account; workspace: Workspaces },
    eventBatch: BatchEventDto,
    session: string
  ) {
    return Sentry.startSpan({ name: 'EventsService.batch' }, async () => {
      let err: any;
      try {
        for (const thisEvent of eventBatch.batch) {
          if (
            thisEvent.source === 'message' &&
            thisEvent.event === '$delivered'
          )
            continue;
          if (thisEvent.source === 'message' && thisEvent.event === '$opened') {
            const clickHouseRecord: ClickHouseMessage = {
              workspaceId:
                thisEvent.payload.workspaceID || thisEvent.payload.workspaceId,
              stepId: thisEvent.payload.stepID || thisEvent.payload.stepId,
              customerId:
                thisEvent.payload.customerID || thisEvent.payload.customerId,
              templateId:
                String(thisEvent.payload.templateID) ||
                String(thisEvent.payload.templateId),
              messageId:
                thisEvent.payload.messageID || thisEvent.payload.messageId,
              event: 'opened',
              eventProvider: ClickHouseEventProvider.PUSH,
              processed: false,
              createdAt: new Date(),
            };
            await this.webhooksService.insertMessageStatusToClickhouse(
              [clickHouseRecord],
              session
            );
          } else {
            switch (thisEvent.event) {
              case '$identify':
                this.debug(
                  `Handling $identify event for correlationKey: ${thisEvent.correlationValue}`,
                  this.batch.name,
                  session,
                  auth.account.id
                );
                await this.handleIdentify(auth, thisEvent, session);
                break;
              case '$set':
                this.debug(
                  `Handling $set event for correlationKey: ${thisEvent.correlationValue}`,
                  this.batch.name,
                  session,
                  auth.account.id
                );
                await this.handleSet(auth, thisEvent, session);
                break;
              default:
                await this.customPayload(
                  { account: auth.account, workspace: auth.workspace },
                  thisEvent,
                  session
                );
                if (!thisEvent.correlationValue) {
                  throw new Error('correlation value is empty');
                }
                break;
            }
          }
        }
        //}
      } catch (e) {
        this.error(e, this.batch.name, session, auth.account.email);
        err = e;
      } finally {
        if (err) throw err;
      }
    });
  }

  async handleSet(
    auth: { account: Account; workspace: Workspaces },
    event: EventDto,
    session: string
  ) {
    const customerId = event.correlationValue;
    const updatePayload = event.payload;
    const workspaceId = auth.workspace.id;

    if (!customerId) {
      throw new Error('Customer ID is missing from the event');
    }

    // Retrieve all CustomerKeys for the workspace
    const customerKeys = await this.customerKeysService.getAll(workspaceId, session);

    const customersPrimaryKey = customerKeys.find((k) => k.is_primary);

    if (!customersPrimaryKey) {
      this.warn(
        `Primary key not found for workspace --set a primary key first`,
        this.handleSet.name,
        session,
        auth.account.email
      );
      return;
    }

    const { customer, findType } = await this.findOrCreateCustomer(
      auth.workspace,
      session,
      null,
      null,
      event
    );

    // Filter and validate the event payload against CustomerKeys
    // Exclude the primary key and 'other_ids' from updates
    const filteredPayload = {};
    Object.keys(event.payload).forEach((key) => {
      if (key !== customersPrimaryKey.name && key !== 'other_ids') {
        const customerKey = customerKeys.find((k) => k.name === key);
        if (
          customerKey &&
          this.isValidType(event.payload[key], customerKey.attribute_type.name)
        ) {
          filteredPayload[key] = event.payload[key];
        } else {
          console.warn(
            `Skipping update for key ${key}: Type mismatch or key not allowed.`
          );
        }
      }
    });

    await this.customersService.updateCustomer(auth.account, customer.id, 'user_attributes',
      {
        ...filteredPayload
      },
      session
    );

    const clickHouseRecord: ClickHouseEvent = await this.recordEvent(
      event,
      workspaceId,
      ClickHouseEventSource.MOBILE,
      customer
    );

    return customer.id;
  }

  async deduplication(
    customer: Customer,
    correlationValue: string | string[],
    session: string,
    account: Account
  ) {

    // event might not have a correlation value
    // need to filter identify call
    if (!correlationValue)
        return;

    let updateResult;

    // Step 1: Check if the customer's _id is not equal to the given correlation value
    if (customer.id.toString() !== correlationValue) {
      const newValue = (typeof correlationValue) === 'string'
            ? [correlationValue, ...customer.other_ids]
            : [...correlationValue, ...customer.other_ids];
      // Step 2: Update the customer's other_ids array with the correlation value if it doesn't already have it
      updateResult = await this.customersService.updateCustomer(account, customer.id, 'other_ids',
        newValue,
        session);
    }

    const customerCorrelationValue = Array.isArray(correlationValue) ? correlationValue[0] : correlationValue;

    // Additional Step: Retrieve the potential duplicate customer to compare deviceTokenSetAt for both device types
    const duplicateCustomer = await this.customersService.findOneByUUID(account, customerCorrelationValue, session);

    // Determine which deviceTokenSetAt fields to compare
    const deviceTypes = ['ios', 'android'];
    const updateFields = {};

    for (const type of deviceTypes) {
      const tokenField = `${type}DeviceToken`;
      const setAtField = `${type}DeviceTokenSetAt`;

      // Check if the duplicate has a more recent deviceToken for each type
      if (
        duplicateCustomer &&
        duplicateCustomer[setAtField] &&
        (!customer[setAtField] ||
          duplicateCustomer[setAtField] > customer[setAtField])
      ) {
        // Prepare update object with the more recent deviceToken and its setAt timestamp
        updateFields[tokenField] = duplicateCustomer[tokenField];
        updateFields[setAtField] = duplicateCustomer[setAtField];
      }
    }

    // If there are fields to update (i.e., a more recent token was found), perform the update
    if (Object.keys(updateFields).length > 0) {
      await this.customersService.updateCustomer(account, customer.id, 'user_attributes',
        {
          ...updateFields,
        },
        session);
    }

    // Step 3: Delete any other customers that have an _id matching the correlation value
    if (typeof correlationValue === 'string') {
      await this.customersService.deleteByUUID(account, correlationValue);
    }
    else {
      for (const id of correlationValue) {
        await this.customersService.deleteByUUID(account, id);
      }
    }
  }

  async findOrCreateCustomer(
    workspace: Workspaces,
    session: string,
    primaryKeyValue?: string,
    primaryKeyName?: string,
    event?: EventDto
  ): Promise<{ customer: any; findType: FindType }> {
    let { customer, findType } =
      await this.customersService.findOrCreateCustomerBySearchOptions(
        workspace,
        {
          primaryKey: { name: primaryKeyName, value: primaryKeyValue },
        },
        session,
        {},
        'event',
        event
      );

    return { customer, findType };
  }

  /*
   * Check to see if a customer found by primary key, if not search by _id
   *  if found by _id, update the user's primary key and fields
   *  If found by primary key update by fields
   */

  async handleIdentify(
    auth: { account: Account; workspace: Workspaces },
    event: EventDto, // Assuming EventDto has all the necessary fields including payload
    session: string
  ) {
    const primaryKeyValue = event.payload?.distinct_id; // Adjust based on your actual primary key field
    if (!primaryKeyValue) {
      this.warn(
        `No primary key provided in $identify event:${JSON.stringify(event)}`,
        this.handleIdentify.name,
        session,
        auth.account.email
      );
      return;
    }

    const workspaceId = auth.workspace.id;

    // Retrieve all CustomerKeys for the workspace to validate and filter updates
    const customerKeys = await this.customerKeysService.getAll(workspaceId, session);

    // Find the primary key among the CustomerKeys
    const customersPrimaryKey = customerKeys.find((k) => k.is_primary);

    if (!customersPrimaryKey) {
      this.debug(
        `Primary key not found for workspace --go set a primary key`,
        this.handleIdentify.name,
        session,
        auth.account.id
      );
      // Handle the absence of a primary key definition
      return;
    }

    // Now you have the primary key's name and type
    const primaryKeyName = customersPrimaryKey.name;
    const primaryKeyType = customersPrimaryKey.attribute_type.name;

    // Check if the primary key value matches the expected type
    if (!this.isValidType(primaryKeyValue, primaryKeyType)) {
      this.debug(
        `Primary key value type in identify does not match expected type: ${primaryKeyType}`,
        this.handleIdentify.name,
        session,
        auth.account.id
      );
      // Handle the type mismatch as necessary
      return;
    }

    const { customer, findType } = await this.findOrCreateCustomer(
      auth.workspace,
      session,
      primaryKeyValue,
      primaryKeyName,
      event
    );
    //check the customer does not have another primary key already if it does this is not supported right now
    if (findType == FindType.CORRELATION_VALUE) {
      if (
        customer.primaryKeyName &&
        customer.primaryKeyName !== primaryKeyValue
      ) {
        this.debug(
          `found customers primary key: ${customer.primaryKeyName} does not match event primary key`,
          this.handleIdentify.name,
          session,
          auth.account.id
        );
        return;
      }
    }

    if (event.correlationValue && (customer.uuid !== event.correlationValue)) {
      await this.deduplication(
        customer,
        event.correlationValue,
        session,
        auth.account
      );
    }

    // Filter and validate the event payload against CustomerKeys, with special handling for distinct_id and $anon_distinct_id
    const filteredPayload = {};
    const otherIdsUpdates = [];

    Object.keys(event.payload).forEach((key) => {
      if (key === 'distinct_id') {
        // Handle distinct_id: Check if it matches the primary key type and set customer's primary key
        const isValid = this.isValidType(event.payload[key], primaryKeyType); // Assume primaryKeyType is determined earlier
        if (isValid) {
          filteredPayload[primaryKeyName] = event.payload[key]; // Or handle updating the primary key as needed
        } else {
          //console.warn(`Skipping update for distinct_id: Type mismatch.`);
        }
      } else if (key === '$anon_distinct_id') {
        // Check and add $anon_distinct_id to other_ids if not already present and valid and not equal to the customer's own _id
        const isValid = this.isValidType(
          event.payload[key],
          AttributeTypeName.STRING
        ); // Assuming $anon_distinct_id should always be a string
        const anonId = event.payload[key];
        if (
          isValid &&
          !customer.other_ids.includes(event.payload[key]) &&
          customer.id !== anonId
        ) {
          otherIdsUpdates.push(anonId);
        } else {
        }
      } else {
        // Handle other keys normally
        const customerKey = customerKeys.find((k) => k.name === key);
        if (
          customerKey &&
          this.isValidType(event.payload[key], customerKey.attribute_type.name)
        ) {
          filteredPayload[key] = event.payload[key];
        } else {
        }
      }
    });

    await this.customersService.updateCustomer(auth.account, customer.id, 'other_ids',
      [
        ...otherIdsUpdates,
        ...customer.other_ids
      ],
      session);

    await this.customersService.updateCustomer(auth.account, customer.id, 'user_attributes',
      {
        ...filteredPayload,
      },
      session);

    const clickHouseRecord: ClickHouseEvent = await this.recordEvent(
      event,
      workspaceId,
      ClickHouseEventSource.MOBILE,
      customer
    );

    return customer.id;
  }

  async handleFCM(
    auth: { account: Account; workspace: Workspaces },
    event: EventDto,
    session: string
  ) {
    // Extract device tokens from the event payload
    const { iosDeviceToken, androidDeviceToken } = event.$fcm;
    const customerId = event.correlationValue; // Or distinct_id, assuming they are meant to represent the same identifier

    // Determine which device token is provided
    const deviceTokenField = iosDeviceToken
      ? 'iosDeviceToken'
      : 'androidDeviceToken';
    const deviceTokenValue = iosDeviceToken || androidDeviceToken;
    const deviceTokenSetAtField = iosDeviceToken
      ? 'iosDeviceTokenSetAt'
      : 'androidDeviceTokenSetAt';

    // Ensure a device token and customerId are provided
    if (!deviceTokenValue || !customerId) {
      this.debug(
        `Missing device token or customerId in FCM event`,
        this.handleFCM.name,
        session,
        auth.account.id
      );
      return;
    }

    // Retrieve the customer based on customerId
    const workspaceId = auth.workspace.id;
    const { customer, findType } = await this.findOrCreateCustomer(
      auth.workspace,
      session,
      null,
      null,
      event
    );

    // Update the customer with the provided device token
    const updatedCustomer =
      await this.customersService.updateCustomer(auth.account, customer.id, 'user_attributes',
        {
          [deviceTokenField]: deviceTokenValue,
          [deviceTokenSetAtField]: new Date(),
        },
        session
      );
    return updatedCustomer;
  }

  isValidType(value: any, type: string): boolean {
    switch (type) {
      case "String":
        return typeof value === 'string';
      case "Number":
        return typeof value === 'number';
      case "Boolean":
        return typeof value === 'boolean';
      case "Email":
        return typeof value === 'string' && /^\S+@\S+\.\S+$/.test(value);
      case "Date":
      case "DateTime":
        return !isNaN(Date.parse(value));
      case "Array":
        return Array.isArray(value);
      case "Object":
        return (
          typeof value === 'object' && !Array.isArray(value) && value !== null
        );
      default:
        return false;
    }
  }

  async getNewEventPayloadAttributes(clickHouseRecord: ClickHouseEvent) {

  }

  async createMaterializedColumnsForEventPayload(clickHouseRecord: ClickHouseEvent) {


  }

  async recordEvent(
    event: EventDto,
    workspaceId: string,
    source: ClickHouseEventSource,
    customer?: Customer
  ): Promise<ClickHouseEvent> {
    const clickHouseRecord: ClickHouseEvent = await this.insertEvent(
      event,
      workspaceId,
      ClickHouseEventSource.MOBILE,
      customer
    );

    const newEventPayloadAttributes = await this.getNewEventPayloadAttributes(clickHouseRecord);
    await this.createMaterializedColumnsForEventPayload(clickHouseRecord);

    return clickHouseRecord;
  }

  async insertEvent(
    event: EventDto,
    workspaceId: string,
    source: ClickHouseEventSource,
    customer?: Customer
  ): Promise<ClickHouseEvent> {
    const clickHouseRecord: ClickHouseEvent = this.toClickHouseEvent(
      event,
      workspaceId,
      ClickHouseEventSource.MOBILE,
      customer
    );

    await this.clickhouseClient.insertAsync({
      table: ClickHouseTable.EVENTS,
      values: [clickHouseRecord],
      format: 'JSONEachRow',
    });

    return clickHouseRecord;
  }

  toClickHouseEvent(
    event: EventDto,
    workspaceId: string,
    source: ClickHouseEventSource,
    customer?: Customer
  ): ClickHouseEvent {
    // Fields to be set by DB:
    // created_at

    const clickHouseRecord: ClickHouseEvent = {
      uuid: event.uuid,
      generated_at: event.timestamp || new Date(),
      correlation_key: event.correlationKey,
      correlation_value: event.correlationValue,
      event: event.event,
      payload: event.payload,
      context: event.context,
      source: source,
      workspace_id: workspaceId,
      customer_id: customer?.id,
    };

    return clickHouseRecord;
  }
}
