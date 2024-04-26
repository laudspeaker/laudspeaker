import {
  Processor,
  WorkerHost,
  InjectQueue,
  OnWorkerEvent,
} from '@nestjs/bullmq';
import { Job, MetricsTime, Queue, UnrecoverableError } from 'bullmq';
import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Correlation, CustomersService } from '../customers/customers.service';
import { DataSource, Repository } from 'typeorm';
import mongoose, { Model } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Journey } from '../journeys/entities/journey.entity';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import {
  PosthogEventType,
  PosthogEventTypeDocument,
} from './schemas/posthog-event-type.schema';
import { JourneysService } from '../journeys/journeys.service';
import { EventDto } from './dto/event.dto';
import {
  PosthogEvent,
  PosthogEventDocument,
} from './schemas/posthog-event.schema';
import { EventDocument } from './schemas/event.schema';
import {
  Customer,
  CustomerDocument,
} from '../customers/schemas/customer.schema';
import * as Sentry from '@sentry/node';
import { EventType } from './events.processor';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { Workspaces } from '../workspaces/entities/workspaces.entity';
import { EventsService } from './events.service';

export enum ProviderType {
  LAUDSPEAKER = 'laudspeaker',
  WU_ATTRIBUTE = 'wu_attribute',
  MESSAGE = 'message',
}

@Injectable()
@Processor('events_pre', {
  metrics: {
    maxDataPoints: MetricsTime.ONE_WEEK,
  },
  concurrency: process.env.EVENTS_PRE_PROCESSOR_CONCURRENCY
    ? +process.env.EVENTS_PRE_PROCESSOR_CONCURRENCY
    : 1,
})
export class EventsPreProcessor extends WorkerHost {
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
    @InjectConnection() private readonly connection: mongoose.Connection,
    @Inject(forwardRef(() => CustomersService))
    private readonly customersService: CustomersService,
    @Inject(forwardRef(() => EventsService))
    private readonly eventsService: EventsService,
    @Inject(forwardRef(() => JourneysService))
    private readonly journeysService: JourneysService,
    @InjectModel(Event.name)
    private eventModel: Model<EventDocument>,
    @InjectModel(PosthogEvent.name)
    private posthogEventModel: Model<PosthogEventDocument>,
    @InjectModel(PosthogEventType.name)
    private posthogEventTypeModel: Model<PosthogEventTypeDocument>,
    @InjectModel(Customer.name) public customerModel: Model<CustomerDocument>,
    @InjectQueue('events') private readonly eventsQueue: Queue,
    @InjectRepository(Journey)
    private readonly journeysRepository: Repository<Journey>
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
    const transactionSession = await this.connection.startSession();
    transactionSession.startTransaction();
    let err: any;
    try {
      //find customer associated with event or create new customer if not found
      //console.time(`handleCustom - findOrCreateCustomer ${job.data.session}`)
      const {
        customer,
        findType,
      }: { customer: CustomerDocument; findType: number } =
        await this.eventsService.findOrCreateCustomer(
          job.data.workspace.id,
          job.data.session,
          null,
          null,
          job.data.event
        );
      //console.timeEnd(`handleCustom - findOrCreateCustomer ${job.data.session}`)
      //get all the journeys that are active, and pipe events to each journey in case they are listening for event
      //console.time(`handleCustom - find journeys ${job.data.session}`)
      const journeys = await this.journeysRepository.find({
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
      //console.timeEnd(`handleCustom - find journeys ${job.data.session}`)
      // add event to event database for visibility
      if (job.data.event) {
        //console.time(`handleCustom - create event ${job.data.session}`)
        await this.eventModel.create(
          [
            {
              ...job.data.event,
              workspaceId: job.data.workspace.id,
              createdAt: new Date().toISOString(),
            },
          ],
          { session: transactionSession }
        );
        //console.timeEnd(`handleCustom - create event ${job.data.session}`)
      }

      await transactionSession.commitTransaction();

      // Always add jobs after committing transactions, otherwise there could be race conditions
      for (let i = 0; i < journeys.length; i++) {
        //console.time(`handleCustom - adding to queue ${job.data.session}`)
        await this.eventsQueue.add(
          EventType.EVENT,
          {
            account: job.data.owner,
            workspace: job.data.workspace,
            event: job.data.event,
            journey: journeys[i],
            customer: customer,
            session: job.data.session,
          },
          {
            attempts: Number.MAX_SAFE_INTEGER,
            backoff: { type: 'fixed', delay: 1000 },
          }
        );
        //console.timeEnd(`handleCustom - adding to queue ${job.data.session}`)
      }
    } catch (e) {
      if (transactionSession.inTransaction())
        transactionSession.abortTransaction();
      this.error(
        e,
        this.handleCustom.name,
        job.data.session,
        job.data.owner.email
      );
      err = e;
    } finally {
      await transactionSession.endSession();
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
    const transactionSession = await this.connection.startSession();
    transactionSession.startTransaction();
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
        await this.eventsQueue.add(
          EventType.MESSAGE,
          {
            workspaceId: job.data.workspaceId,
            message: job.data.message,
            customer: job.data.customer,
            journeyID: journeys[i].id,
          },
          {
            attempts: Number.MAX_SAFE_INTEGER,
            backoff: { type: 'fixed', delay: 1000 },
          }
        );
      }

      await transactionSession.commitTransaction();
      await queryRunner.commitTransaction();
    } catch (e) {
      await transactionSession.abortTransaction();
      await queryRunner.rollbackTransaction();
      this.error(
        e,
        this.handleMessage.name,
        job.data.session,
        job.data.accountID
      );
      err = e;
    } finally {
      await transactionSession.endSession();
      await queryRunner.release();
    }
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

  async handleAttributeChange(job: Job<any, any, string>): Promise<any> {
    const transactionSession = await this.connection.startSession();
    transactionSession.startTransaction();
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
          await this.eventsQueue.add(
            EventType.ATTRIBUTE,
            {
              accountID: job.data.account.id,
              customer: job.data.message.documentKey._id,
              fields: job.data.message.updateDescription?.updatedFields,
              journeyID: journeys[i].id,
            },
            {
              attempts: Number.MAX_SAFE_INTEGER,
              backoff: { type: 'fixed', delay: 1000 },
            }
          );
        }
      }

      await transactionSession.commitTransaction();
      await queryRunner.commitTransaction();
    } catch (e) {
      await transactionSession.abortTransaction();
      await queryRunner.rollbackTransaction();
      this.error(
        e,
        this.handleAttributeChange.name,
        job.data.session,
        job.data.account
      );
      err = e;
    } finally {
      await transactionSession.endSession();
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
