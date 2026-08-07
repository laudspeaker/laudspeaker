import { Inject, Logger, forwardRef } from '@nestjs/common';
import { Injectable } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import {
  OnWorkerEvent,
} from '@nestjs/bullmq';
import { Job, MetricsTime, Queue } from 'bullmq';
import { DataSource, Repository } from 'typeorm';
import * as _ from 'lodash';
import * as Sentry from '@sentry/node';
import { Account } from '../../accounts/entities/accounts.entity';
import { Segment, SegmentType } from '../entities/segment.entity';
import { SegmentsService } from '../segments.service';
import { CustomersService } from '../../customers/customers.service';
import { CreateSegmentDTO } from '../dto/create-segment.dto';
import { SegmentCustomers } from '../entities/segment-customers.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { UpdateSegmentDTO } from '../dto/update-segment.dto';
import { Workspaces } from '../../workspaces/entities/workspaces.entity';
import { SegmentCustomersService } from '../segment-customers.service';
import { Journey } from '../../journeys/entities/journey.entity';
import { Step } from '../../steps/entities/step.entity';
import { StepsService } from '../../steps/steps.service';
import { Processor } from '../../../common/services/queue/decorators/processor';
import { ProcessorBase } from '../../../common/services/queue/classes/processor-base';
import { QueueType } from '../../../common/services/queue/types/queue-type';
import { Producer } from '../../../common/services/queue/classes/producer';
import { Query } from '../../../common/services/query';

@Injectable()
@Processor('segment_update')
export class SegmentUpdateProcessor extends ProcessorBase {
  private providerMap = {
    updateDynamic: this.handleUpdateDynamic,
    updateManual: this.handleUpdateManual,
    createDynamic: this.handleCreateDynamic,
    createSystem: this.handleCreateSystem,
  };
  constructor(
    private dataSource: DataSource,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @Inject(SegmentsService) private segmentsService: SegmentsService,
    @Inject(StepsService) private stepsService: StepsService,
    @Inject(forwardRef(() => CustomersService))
    private customersService: CustomersService,
    @Inject(SegmentCustomersService)
    private segmentCustomersService: SegmentCustomersService,
    @InjectRepository(SegmentCustomers)
    private segmentCustomersRepository: Repository<SegmentCustomers>
  ) {
    super();
  }

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: SegmentUpdateProcessor.name,
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
        class: SegmentUpdateProcessor.name,
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
        class: SegmentUpdateProcessor.name,
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
        class: SegmentUpdateProcessor.name,
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
        class: SegmentUpdateProcessor.name,
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
  async process(job: any): Promise<any> {
    const fn = this.providerMap[job.name];
    const that = this;

    return Sentry.startSpan(
      { name: `${SegmentUpdateProcessor.name}.${fn.name}` },
      async () => {
        await fn.call(that, job);
      }
    );
  }

  /*
   * Creates system segments when a journey is started. For every multisplit branch, it creates a segment that
   * has the multisplit branch defintiont as the segment defintoin. All of the matching customers are then
   * added to that segment for future multisplit assessments.
   */
  async handleCreateSystem(
    job: Job<
      {
        account: Account;
        session: string;
        journey: Journey;
        segment: Segment;
      },
      any,
      string
    >
  ) {
    while (true) {
      // TODO: implement using RMQCountFetcher, or use different logic
      // const jobCounts = await this.customerChangeQueue.getJobCounts('active');
      // const activeJobs = jobCounts.active;
      const activeJobs = 0;

      if (activeJobs > 0) {
        this.warn(
          `Waiting for the customer change queue to clear. Current active jobs: ${activeJobs}`,
          this.process.name,
          job.data.session
        );
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Sleep for 1 second before checking again
      } else {
        break;
      }
    }
    const queryRunner = await this.dataSource.createQueryRunner();
    const client = await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const workspaceId = job?.data?.account?.teams?.[0]?.organization?.workspaces?.[0]?.id;

      const query = Query.fromJSON(job.data.segment.inclusionCriteria);
      query.setContext({
        workspace_id: workspaceId,
      });

      await this.segmentCustomersService.populateEmptySegment(
        job.data.segment,
        query,
        job.data.session,
        job.data.account,
        queryRunner
      );

      let last = false;
      queryRunner.manager.query('SELECT pg_advisory_lock(12345)');
      const journey = await queryRunner.manager.findOne(Journey, {
        where: { id: job.data.journey.id },
      });
      if (journey) {
        journey.completedSystemSegments += 1;
        await queryRunner.manager.save(journey);
        if (journey.completedSystemSegments === journey.totalSystemSegments)
          last = true;
      }
      await queryRunner.manager.query('SELECT pg_advisory_unlock(12345)');
      if (last)
        await Producer.add(QueueType.ENROLLMENT, {
          account: job.data.account,
          journey: job.data.journey,
          session: job.data.session,
        });
    } catch (err) {
      this.error(
        err,
        this.handleCreateSystem.name,
        job.data.session,
        job.data.account.email
      );
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  async handleCreateDynamic(
    job: Job<
      {
        account: Account;
        segment: Segment;
        session: string;
        createSegmentDTO: CreateSegmentDTO;
      },
      any,
      string
    >
  ) {
    let err: any;
    // await this.customerChangeQueue.pause();
    while (true) {
      // const jobCounts = await this.customerChangeQueue.getJobCounts('active');
      // const activeJobs = jobCounts.active;
      const activeJobs = 0;

      if (activeJobs === 0) {
        break; // Exit the loop if the number of waiting jobs is below the threshold
      }

      this.warn(
        `Waiting for the customer change queue to clear. Current active jobs: ${activeJobs}`,
        this.process.name,
        job.data.session
      );
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Sleep for 1 second before checking again
    }

    // await this.importsQueue.pause();
    while (true) {
      // const jobCounts = await this.importsQueue.getJobCounts('active');
      // const activeJobs = jobCounts.active;
      const activeJobs = 0;

      if (activeJobs === 0) {
        break; // Exit the loop if the number of waiting jobs is below the threshold
      }

      this.warn(
        `Waiting for the import queue to clear. Current active jobs: ${activeJobs}`,
        this.process.name,
        job.data.session
      );
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Sleep for 1 second before checking again
    }

    const workspaceId = job?.data?.account?.teams?.[0]?.organization?.workspaces?.[0]?.id;

    const query = Query.fromJSON(job.data.createSegmentDTO);
    query.setContext({
      workspace_id: workspaceId,
    });
    
    const queryRunner = await this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      await this.segmentCustomersService.populateEmptySegment(
        job.data.segment,
        query,
        job.data.session,
        job.data.account,
        queryRunner
      );

      await queryRunner.manager.save(Segment, {
        ...job.data.segment,
        isUpdating: false,
      });
      await queryRunner.commitTransaction();
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
      // await this.customerChangeQueue.resume();
      // await this.importsQueue.resume();
      if (err) throw err;
    }
  }

  async handleUpdateDynamic(
    job: Job<
      {
        account: Account;
        id: string;
        session: string;
        updateSegmentDTO: UpdateSegmentDTO;
        workspace: Workspaces;
      },
      any,
      string
    >
  ) {
    let err: any;
    // await this.customerChangeQueue.pause();
    while (true) {
      // const jobCounts = await this.customerChangeQueue.getJobCounts('active');
      // const activeJobs = jobCounts.active;
      const activeJobs = 0;

      if (activeJobs === 0) {
        break; // Exit the loop if the number of waiting jobs is below the threshold
      }

      this.warn(
        `Waiting for the queue to clear. Current active jobs: ${activeJobs}`,
        this.process.name,
        job.data.session
      );
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Sleep for 1 second before checking again
    }
    const queryRunner = await this.dataSource.createQueryRunner();
    const client = await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const segment = await this.segmentsService.findOne(
        job.data.account,
        job.data.id,
        job.data.session
      );
      const forDelete = await this.segmentCustomersRepository.findBy({
        segment: { id: segment.id },
      });

      for (const { customer } of forDelete) {
        await this.segmentsService.updateAutomaticSegmentCustomerInclusion(
          job.data.account,
          customer,
          job.data.session
        );
      }

      const amount = await this.customersService.countCustomersInWorkspace(job.data.workspace.id);

      const batchOptions = {
        current: 0,
        documentsCount: amount || 0,
        batchSize: 500,
      };

      while (batchOptions.current < batchOptions.documentsCount) {
        const batch = await this.customersService.get(job.data.workspace.id, job.data.session, batchOptions.current, batchOptions.batchSize)

        for (const customer of batch) {
          await this.segmentsService.updateAutomaticSegmentCustomerInclusion(
            job.data.account,
            customer,
            job.data.session
          );
        }

        batchOptions.current += batchOptions.batchSize;
      }

      const records = await this.segmentCustomersRepository.findBy({
        segment: { id: segment.id },
      });

      await queryRunner.manager.save(Segment, {
        ...segment,
        isUpdating: false,
      });
      await queryRunner.commitTransaction();
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

  async handleUpdateManual(
    job: Job<
      {
        account: Account;
        segment: Segment;
        session: string;
        csvFile: any;
      },
      any,
      string
    >
  ) {
    let err: any;
    const queryRunner = await this.dataSource.createQueryRunner();
    const client = await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const { stats } = await this.customersService.loadCSV(
        job.data.account,
        job.data.csvFile,
        job.data.session
      );

      await this.segmentsService.assignCustomers(
        job.data.account,
        job.data.segment.id,
        stats.customers,
        job.data.session
      );

      await queryRunner.manager.save(Segment, {
        ...job.data.segment,
        isUpdating: false,
      });
      await queryRunner.commitTransaction();
    } catch (e) {
      this.error(
        e,
        this.handleUpdateManual.name,
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
      scope.setTag('processor', SegmentUpdateProcessor.name);
      Sentry.captureException(error);
    });
  }
}
