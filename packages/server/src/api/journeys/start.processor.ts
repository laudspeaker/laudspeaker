/* eslint-disable no-case-declarations */
import { Inject, Logger } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import {
  Processor,
  WorkerHost,
  InjectQueue,
  OnWorkerEvent,
} from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { DataSource, FindCursor } from 'typeorm';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import * as _ from 'lodash';
import * as Sentry from '@sentry/node';
import { CustomersService } from '../customers/customers.service';
import { Step } from '../steps/entities/step.entity';
import { Account } from '../accounts/entities/accounts.entity';
import { Journey } from './entities/journey.entity';
import { JourneyLocationsService } from './journey-locations.service';
import { JourneysService } from './journeys.service';
import { CustomerDocument } from '../customers/schemas/customer.schema';

const BATCH_SIZE = +process.env.START_BATCH_SIZE;

@Injectable()
@Processor('start', { removeOnComplete: { age: 0, count: 0 } })
export class StartProcessor extends WorkerHost {
  constructor(
    private dataSource: DataSource,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @InjectQueue('transition') private readonly transitionQueue: Queue,
    @InjectQueue('start') private readonly startQueue: Queue,
    @InjectConnection() private readonly connection: mongoose.Connection,
    @Inject(CustomersService)
    private readonly customersService: CustomersService,
    @Inject(JourneyLocationsService)
    private readonly journeyLocationsService: JourneyLocationsService,
    @Inject(JourneysService)
    private readonly journeysService: JourneysService
  ) {
    super();
  }

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: StartProcessor.name,
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
        class: StartProcessor.name,
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
        class: StartProcessor.name,
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
        class: StartProcessor.name,
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
        class: StartProcessor.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  /**
   * Main function to add customer to a Journey.
   *
   * `Job` type contains the following fields :
   * - `ownerID` Owner of the Journey
   * - `stepID` ID of journey's start step
   * - `skip` How many documents to skip when querying mongo
   * - `limit` Limit on returned number of mongo documents
   * - `query` The query to perform to lookup customers
   * - `session` Session used for logging
   *
   * This is a recursive function. Looks at `START_BATCH_SIZE` environment variable
   * and recursively doubles jobs while halving the number of documents per job
   * until number of customers to add is less than `START_BATCH_SIZE`, updating
   * skip parameters when enqueing new jobs.
   *
   * Base case finds all customer IDs, adds row `(customerID, stepID,
   * entranceTimestamp)` to `Location` table in postgres, then adds
   * @param job
   */
  async process(
    job: Job<
      {
        ownerID: string;
        stepID: string;
        journeyID: string;
        skip: number;
        limit: number;
        query: any;
        session: string;
      },
      any,
      string
    >
  ): Promise<any> {
    //base case: get documents, set them as moving in location table, and batch add the jobs to the transition queue
    if (job.data.limit <= BATCH_SIZE) {
      let err: any;
      const queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      const transactionSession = await this.connection.startSession();
      transactionSession.startTransaction();
      try {
        // Retrieve customers from mongo
        const customers = await this.customersService.find(
          job.data.ownerID,
          job.data.query,
          job.data.session,
          transactionSession,
          job.data.skip,
          job.data.limit
        );
        const account = await queryRunner.manager.findOne(Account, {
          where: {
            id: job.data.ownerID,
          },
        });
        const journey = await queryRunner.manager.findOne(Journey, {
          where: {
            id: job.data.journeyID,
          },
        });
        await this.journeysService.enrollCustomersInJourney(
          account,
          journey,
          customers,
          job.data.session,
          queryRunner,
          transactionSession
        );
        await transactionSession.commitTransaction();
        await queryRunner.commitTransaction();
      } catch (e) {
        this.error(e, this.process.name, job.data.session, job.data.ownerID);
        await transactionSession.abortTransaction();
        await queryRunner.rollbackTransaction();
        err = e;
      } finally {
        await transactionSession.endSession();
        await queryRunner.release();
        if (err) throw err;
      }
    }
    //otherwise, split query in half and add both halves to the start queue
    else {
      await this.startQueue.addBulk([
        {
          name: 'start',
          data: {
            ownerID: job.data.ownerID,
            journeyID: job.data.journeyID,
            stepID: job.data.stepID,
            session: job.data.session,
            query: job.data.query,
            skip: job.data.skip,
            limit: Math.floor(job.data.limit / 2),
          },
        },
        {
          name: 'start',
          data: {
            ownerID: job.data.ownerID,
            journeyID: job.data.journeyID,
            stepID: job.data.stepID,
            session: job.data.session,
            query: job.data.query,
            skip: job.data.skip + Math.floor(job.data.limit / 2),
            limit: Math.floor(job.data.limit / 2),
          },
        },
      ]);
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error, prev?: string) {
    Sentry.withScope((scope) => {
      scope.setTag('job_id', job.id);
      scope.setTag('processor', StartProcessor.name);
      Sentry.captureException(error);
    });
  }
}
