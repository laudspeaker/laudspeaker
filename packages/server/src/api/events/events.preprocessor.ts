import {
  Processor,
  WorkerHost,
  InjectQueue,
  OnWorkerEvent,
} from '@nestjs/bullmq';
import { Job, Queue, UnrecoverableError } from 'bullmq';
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

export enum ProviderType {
  LAUDSPEAKER = 'laudspeaker',
  WU_ATTRIBUTE = 'wu_attribute',
  MESSAGE = 'message',
}

@Injectable()
@Processor('events_pre', { removeOnComplete: { count: 1000 }, concurrency: 10 })
export class EventsPreProcessor extends WorkerHost {
  private providerMap: Record<
    ProviderType,
    (job: Job<any, any, string>) => Promise<void>
  > = {
    [ProviderType.LAUDSPEAKER]: async (job) => {
      await this.handleCustom(job);
    },
    [ProviderType.MESSAGE]: async (job) => {
      await this.handleMessage(job);
    },
    [ProviderType.WU_ATTRIBUTE]: async (job) => {
      await this.handleAttributeChange(job);
    },
  };

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    private dataSource: DataSource,
    @InjectConnection() private readonly connection: mongoose.Connection,
    @Inject(forwardRef(() => CustomersService))
    private readonly customersService: CustomersService,
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
    await this.providerMap[job.name](job);
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
      const correlation: Correlation =
        await this.customersService.findOrCreateByCorrelationKVPair(
          job.data.workspace,
          job.data.event,
          transactionSession
        );
      //get all the journeys that are active, and pipe events to each journey in case they are listening for event
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
      // add event to event database for visibility
      if (job.data.event) {
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
      }

      await transactionSession.commitTransaction();

      // Always add jobs after committing transactions, otherwise there could be race conditions
      for (let i = 0; i < journeys.length; i++) {
        await this.eventsQueue.add(
          EventType.EVENT,
          {
            account: job.data.owner,
            workspace: job.data.workspace,
            event: job.data.event,
            journey: journeys[i],
            customer: correlation.cust,
            session: job.data.session,
          },
          {
            attempts: Number.MAX_SAFE_INTEGER,
            backoff: { type: 'fixed', delay: 1000 },
          }
        );
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
