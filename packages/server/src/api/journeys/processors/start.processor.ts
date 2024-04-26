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
import { Job, MetricsTime, Queue } from 'bullmq';
import { DataSource } from 'typeorm';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import * as _ from 'lodash';
import * as Sentry from '@sentry/node';
import { CustomersService } from '../../customers/customers.service';
import { Account } from '../../accounts/entities/accounts.entity';
import { Journey } from '../entities/journey.entity';
import { JourneyLocationsService } from '../journey-locations.service';
import { JourneysService } from '../journeys.service';
import { Step } from '../../steps/entities/step.entity';
import { Workspace } from '@/api/workspaces/entities/workspace.entity';

const BATCH_SIZE = +process.env.START_BATCH_SIZE;

@Injectable()
@Processor('start', {
  metrics: {
    maxDataPoints: MetricsTime.ONE_WEEK,
  },
  concurrency: process.env.START_PROCESSOR_CONCURRENCY
    ? +process.env.START_PROCESSOR_CONCURRENCY
    : 1,
})
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
        workspace: Workspace;
        owner: Account;
        step: Step;
        journey: Journey;
        skip: number;
        limit: number;
        query: any;
        session: string;
        collectionName: string;
      },
      any,
      string
    >
  ): Promise<any> {
    //base case: get documents, set them as moving in location table, and batch add the jobs to the transition queue
    if (job.data.limit <= BATCH_SIZE) {
      let err: any;
      const queryRunner = await this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        // Retrieve customers from mongo
        const customers = await this.customersService.find(
          job.data.owner,
          job.data.query,
          job.data.session,
          null,
          job.data.skip,
          job.data.limit,
          job.data.collectionName
        );
        // Retreive locations from Postgres
        const locations = await this.journeyLocationsService.findForWriteBulk(
          job.data.journey,
          customers.map((document) => {
            return document._id.toString();
          }),
          queryRunner
        );
        const jobs = await this.journeysService.enrollCustomersInJourney(
          job.data.owner,
          job.data.workspace,
          job.data.journey,
          customers,
          locations,
          job.data.session,
          queryRunner,
          null
        );
        await queryRunner.commitTransaction();
        if (jobs && jobs.length) await this.transitionQueue.addBulk(jobs);
      } catch (e) {
        this.error(e, this.process.name, job.data.session, job.data.owner.id);
        await queryRunner.rollbackTransaction();
        err = e;
      } finally {
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
            owner: job.data.owner,
            workspace: job.data.workspace,
            journey: job.data.journey,
            step: job.data.step,
            session: job.data.session,
            query: job.data.query,
            skip: job.data.skip,
            limit: Math.floor(job.data.limit / 2),
            collectionName: job.data.collectionName,
          },
        },
        {
          name: 'start',
          data: {
            owner: job.data.owner,
            workspace: job.data.workspace,
            journey: job.data.journey,
            step: job.data.step,
            session: job.data.session,
            query: job.data.query,
            skip: job.data.skip + Math.floor(job.data.limit / 2),
            limit: Math.ceil(job.data.limit / 2),
            collectionName: job.data.collectionName,
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
