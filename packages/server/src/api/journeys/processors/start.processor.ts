/* eslint-disable no-case-declarations */
import { Inject, Logger } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import {
  OnWorkerEvent,
} from '@nestjs/bullmq';
import { Job, MetricsTime, Queue } from 'bullmq';
import { DataSource } from 'typeorm';
import * as _ from 'lodash';
import * as Sentry from '@sentry/node';
import { CustomersService } from '../../customers/customers.service';
import { Account } from '../../accounts/entities/accounts.entity';
import { Journey } from '../entities/journey.entity';
import { JourneyLocationsService } from '../journey-locations.service';
import { JourneysService } from '../journeys.service';
import { Step } from '../../steps/entities/step.entity';
import { StepType } from '../../steps/types/step.interface';
import { StepsService } from '../../steps/steps.service';
import { Processor } from '../../../common/services/queue/decorators/processor';
import { ProcessorBase } from '../../../common/services/queue/classes/processor-base';
import { QueueType } from '../../../common/services/queue/types/queue-type';
import { Producer } from '../../../common/services/queue/classes/producer';

const BATCH_SIZE = +process.env.START_BATCH_SIZE;

@Injectable()
@Processor(
  'start', {
    prefetchCount: 1
  })
export class StartProcessor extends ProcessorBase {
  constructor(
    private dataSource: DataSource,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @Inject(CustomersService)
    private readonly customersService: CustomersService,
    @Inject(JourneyLocationsService)
    private readonly journeyLocationsService: JourneyLocationsService,
    @Inject(JourneysService)
    private readonly journeysService: JourneysService,
    @Inject(StepsService) private stepsService: StepsService,
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
   * - `skip` How many documents to skip when querying
   * - `limit` Limit on returned number of documents
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
        const workspaceId = job.data.owner.teams?.[0]?.organization?.workspaces?.[0].id;

        const customerIds = await this.journeyLocationsService.getCustomerIds(
          workspaceId,
          job.data.journey.id,
          job.data.limit,
          job.data.skip);

        const customers = await this.customersService.getCustomersByIds(
          job.data.owner,
          customerIds,
        );
        // Retreive locations from Postgres
        const locations = await this.journeyLocationsService.findForWriteBulk(
          job.data.journey,
          customerIds,
          queryRunner
        );
        const jobsData = await this.journeysService.enrollCustomersInJourney(
          job.data.owner,
          job.data.journey,
          customers,
          locations,
          job.data.session,
          queryRunner,
        );
        await queryRunner.commitTransaction();
        if (jobsData && jobsData.length)
          await Producer.addBulk(QueueType.START_STEP, jobsData);
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
      const jobsData = [
        {
          owner: job.data.owner,
          journey: job.data.journey,
          step: job.data.step,
          session: job.data.session,
          query: job.data.query,
          skip: job.data.skip,
          limit: Math.floor(job.data.limit / 2),
          collectionName: job.data.collectionName,
        },
        {
          owner: job.data.owner,
          journey: job.data.journey,
          step: job.data.step,
          session: job.data.session,
          query: job.data.query,
          skip: job.data.skip + Math.floor(job.data.limit / 2),
          limit: Math.ceil(job.data.limit / 2),
          collectionName: job.data.collectionName,
        },
      ];

      await Producer.addBulk(
        QueueType.START,
        jobsData
      );
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
