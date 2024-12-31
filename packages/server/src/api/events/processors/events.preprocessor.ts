import {
  OnWorkerEvent,
} from '@nestjs/bullmq';
import { Job, MetricsTime, Queue, UnrecoverableError } from 'bullmq';
import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Journey } from '../../journeys/entities/journey.entity';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import * as Sentry from '@sentry/node';
import { EventType } from './events.processor';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from '../../accounts/entities/accounts.entity';
import { Workspaces } from '../../workspaces/entities/workspaces.entity';
import { EventsService } from '../events.service';
import { CacheService } from '../../../common/services/cache.service';
import { FindType } from '../../customers/enums/FindType.enum';
import { Processor } from '../../../common/services/queue/decorators/processor';
import { ProcessorBase } from '../../../common/services/queue/classes/processor-base';
import { QueueType } from '../../../common/services/queue/types/queue-type';
import { Producer } from '../../../common/services/queue/classes/producer';
import { Customer } from '../../customers/entities/customer.entity';
import {
  ClickHouseTable,
  ClickHouseEvent,
  ClickHouseClient
} from '../../..//common/services/clickhouse';
import { CacheConstants } from '../../../common/services/cache.constants';

export enum ProviderType {
  LAUDSPEAKER = 'laudspeaker',
  WU_ATTRIBUTE = 'wu_attribute',
  MESSAGE = 'message',
}

/**
 * EventsPreProcessor is a worker class responsible for preprocessing events.
 * For every event that comes into laudspeaker, it looks up the customer that
 * corresponds to that event (or creates that customer if they don't exist),
 * does an event fan-out for every active journey in the corresponding workspace,
 * adding a corresponding job to the EventsProcessor, and saves the event to the
 * event database.
 */
@Injectable()
@Processor('events_pre')
export class EventsPreProcessor extends ProcessorBase {
  private providerMap: Record<
    ProviderType,
    (job: Job<any, any, string>) => Promise<void>
  > = {
      [ProviderType.LAUDSPEAKER]: this.handleCustom,
      [ProviderType.MESSAGE]: this.handleMessage,
      [ProviderType.WU_ATTRIBUTE]: this.handleAttributeChange,
    };

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    private dataSource: DataSource,
    @Inject(forwardRef(() => EventsService))
    private readonly eventsService: EventsService,
    @InjectRepository(Journey)
    private readonly journeysRepository: Repository<Journey>,
    @Inject(CacheService) private cacheService: CacheService,
    @Inject(ClickHouseClient)
    private clickhouseClient: ClickHouseClient,
  ) {
    super();
  }

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: EventsPreProcessor.name,
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
        class: EventsPreProcessor.name,
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
        class: EventsPreProcessor.name,
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
        class: EventsPreProcessor.name,
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
        class: EventsPreProcessor.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const fn = this.providerMap[job.name];
    const that = this;

    return Sentry.startSpan(
      { name: `EventsPreProcessor.${fn.name}` },
      async () => {
        await fn.call(that, job);
      }
    );
  }

  removeDollarSignsFromKeys(obj: any) {
    const newObj = {};
    // Iterate through each property in the object
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        const newKey = key.startsWith('$') ? key.substring(1) : key;

        // Recursively call the function if the property is an object
        newObj[newKey] =
          typeof obj[key] === 'object' && obj[key] !== null
            ? this.removeDollarSignsFromKeys(obj[key])
            : obj[key];
      }
    }
    return newObj;
  }

  async handleCustom(
    job: Job<
      {
        owner: Account;
        workspace: Workspaces;
        event: any;
        session: string;
      },
      any,
      any
    >
  ): Promise<any> {
    let err: any;
    try {
      const {
        customer,
        findType,
      }: { customer: Customer; findType: FindType } =
        await this.eventsService.findOrCreateCustomer(
          job.data.workspace,
          job.data.session,
          null,
          null,
          job.data.event
        );
      let journeys: Journey[] = await this.cacheService.get(
        CacheConstants.JOURNEYS,
        job.data.workspace.id,
        async () => {
          return await this.journeysRepository.find({
            where: {
              workspace: {
                id: job.data.workspace.id,
              },
              isActive: true,
              isPaused: false,
              isStopped: false,
              isDeleted: false,
            },
          });
        }
      );

      if (job.data.event) {
        const clickHouseRecord: ClickHouseEvent = await this.eventsService.recordEvent(
          job.data.event,
          job.data.workspace.id,
          job.data.event.source,
          customer,
        );
      }

      let eventJobs = journeys.map((journey) => ({
        account: job.data.owner,
        event: job.data.event,
        journey: {
          ...journey,
          visualLayout: {
            edges: [],
            nodes: [],
          },
          inclusionCriteria: {},
        },
        customer: customer,
        session: job.data.session,
      }));

      await Producer.addBulk(QueueType.EVENTS,
        eventJobs,
        EventType.EVENT);
      await Producer.add(QueueType.EVENTS_POST, {
        ...job.data,
        workspace: undefined,
        customer,
      }, job.data.event.event);
    } catch (e) {
      this.error(
        e,
        this.handleCustom.name,
        job.data.session,
        job.data.owner.email
      );
      err = e;
    }

    if (err?.code === 11000) {
      this.warn(
        `${JSON.stringify({
          warning: 'Attempting to insert a duplicate key!',
        })}`,
        this.handleCustom.name,
        job.data.session,
        job.data.owner?.id
      );
      throw err;
    } else if (err) {
      this.error(
        err,
        this.handleCustom.name,
        job.data.session,
        job.data.owner?.id
      );
      throw err;
    }
  }

  async handleMessage(job: Job<any, any, string>): Promise<any> {
    let err: any;
    try {
      const {
        customer,
        findType,
      }: { customer: Customer; findType: FindType } =
        await this.eventsService.findOrCreateCustomer(
          job.data.workspace.id,
          job.data.session,
          null,
          null,
          { correlationKey: '_id', correlationValue: job.data.customer, event: '' }
        );
      let journeys: Journey[] = await this.cacheService.get(
        CacheConstants.JOURNEYS,
        job.data.workspace.id,
        async () => {
          return await this.journeysRepository.find({
            where: {
              workspace: {
                id: job.data.workspace.id,
              },
              isActive: true,
              isPaused: false,
              isStopped: false,
              isDeleted: false,
            },
          });
        }
      );
      for (let i = 0; i < journeys.length; i++) {
        await Producer.add(QueueType.EVENTS, {
          ...job.data,
          workspaceId: job.data.workspaceId,
          message: job.data.message,
          customer,
          journey: journeys[i],
        }, EventType.MESSAGE);
      }
    } catch (e) {
      err = e;
    } finally {
      if (err) {
        this.error(
          err,
          this.handleMessage.name,
          job.data.session,
          job.data.accountID
        );
        throw err;
      }
    }
  }

  async handleAttributeChange(job: Job<any, any, string>): Promise<any> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    let err: any;

    try {
      const journeys = await queryRunner.manager.find(Journey, {
        where: {
          workspace: {
            id: job.data.workspaceId,
          },
          isActive: true,
          isPaused: false,
          isStopped: false,
          isDeleted: false,
        },
      });
      for (let i = 0; i < journeys.length; i++) {
        if (job.data.message.operationType === 'update') {
          await Producer.add(QueueType.EVENTS,
            {
              accountID: job.data.account.id,
              customer: job.data.message.documentKey._id,
              fields: job.data.message.updateDescription?.updatedFields,
              journeyID: journeys[i].id,
            }, EventType.ATTRIBUTE);
        }
      }

      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      this.error(
        e,
        this.handleAttributeChange.name,
        job.data.session,
        job.data.account
      );
      err = e;
    } finally {
      await queryRunner.release();
    }
    if (err) {
      this.error(
        err,
        this.handleAttributeChange.name,
        job.data.session,
        job.data.account.id
      );
      throw err;
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error, prev?: string) {
    Sentry.withScope((scope) => {
      scope.setTag('job_id', job.id);
      scope.setTag('processor', EventsPreProcessor.name);
      Sentry.captureException(error);
    });
  }
}
