/* eslint-disable no-case-declarations */
import { Inject, Logger } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import {
  OnWorkerEvent,
} from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { DataSource } from 'typeorm';
import * as _ from 'lodash';
import * as Sentry from '@sentry/node';
import { Account } from '../../accounts/entities/accounts.entity';
import { Journey } from '../entities/journey.entity';
import { Step } from '../../steps/entities/step.entity';
import { StepsService } from '../../steps/steps.service';
import { CustomersService } from '../../customers/customers.service';
import { JourneysService } from '../../journeys/journeys.service';
import { Processor } from '../../../common/services/queue/decorators/processor';
import { ProcessorBase } from '../../../common/services/queue/classes/processor-base';
import { QueueType } from '../../../common/services/queue/types/queue-type';
import { Producer } from '../../../common/services/queue/classes/producer';

@Injectable()
@Processor(
  'enrollment', {
    prefetchCount: 1
  })
export class EnrollmentProcessor extends ProcessorBase {
  constructor(
    private dataSource: DataSource,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @Inject(StepsService)
    private readonly stepsService: StepsService,
    @Inject(CustomersService)
    private readonly customersService: CustomersService,
    @Inject(JourneysService)
    private journeyService: JourneysService,
  ) {
    super();
  }

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: EnrollmentProcessor.name,
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
        class: EnrollmentProcessor.name,
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
        class: EnrollmentProcessor.name,
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
        class: EnrollmentProcessor.name,
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
        class: EnrollmentProcessor.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  /*
   *
   *
   */
  async process(
    job: Job<
      {
        account: Account;
        journey: Journey;
        session: string;
      },
      any,
      string
    >
  ): Promise<any> {
    let err: any;
    let triggerStartTasks: {
      jobData: any;
    };

    // try {
    //   ({ collectionName, count } = await this.customersService.getAudienceSize(
    //     job.data.account,
    //     job.data.journey.inclusionCriteria,
    //     job.data.session,
    //   ));
    // } catch (error) {
    //   this.error(
    //     error,
    //     this.process.name,
    //     job.data.session,
    //     job.data.account.email
    //   );

    //   throw error;
    // }
    const queryRunner = await this.dataSource.createQueryRunner();
    const client = await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      triggerStartTasks = await this.stepsService.triggerStart(
        job.data.account,
        job.data.journey,
        job.data.journey.inclusionCriteria,
        job.data.session,
      );

      await queryRunner.manager.save(Journey, {
        ...job.data.journey,
        isEnrolling: false,
      });

      const workspace =
        job.data.account?.teams?.[0]?.organization?.workspaces?.[0];

      await this.journeyService.cleanupJourneyCache({
        workspaceId: workspace.id,
      });

      await queryRunner.commitTransaction();

      if (triggerStartTasks) {
        await Producer.add(
          QueueType.START,
          triggerStartTasks.jobData
        );
      }
    } catch (e) {
      this.error(
        e,
        this.process.name,
        job.data.session,
        job.data.account.email
      );
      await queryRunner.rollbackTransaction();
      err = e;
    } finally {
      await queryRunner.release();
      if (err) throw err;
    }
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error, prev?: string) {
    Sentry.withScope((scope) => {
      scope.setTag('job_id', job.id);
      scope.setTag('processor', EnrollmentProcessor.name);
      Sentry.captureException(error);
    });
  }
}
