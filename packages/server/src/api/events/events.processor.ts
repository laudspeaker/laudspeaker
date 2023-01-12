import { AppDataSource } from '@/data-source';
import { Process, Processor } from '@nestjs/bull';
import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Job } from 'bull';
import mongoose, { Model } from 'mongoose';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { AccountsService } from '../accounts/accounts.service';
import { Account } from '../accounts/entities/accounts.entity';
import { Audience } from '../audiences/entities/audience.entity';
import { Correlation, CustomersService } from '../customers/customers.service';
import { CustomerDocument } from '../customers/schemas/customer.schema';
import { Workflow } from '../workflows/entities/workflow.entity';
import { WorkflowTick } from '../workflows/interfaces/workflow-tick.interface';
import { WorkflowsService } from '../workflows/workflows.service';
import { EventDto } from './dto/event.dto';
import { PosthogBatchEventDto } from './dto/posthog-batch-event.dto';
import { PostHogEventDto } from './dto/posthog-event.dto';
import errors from '@/shared/utils/errors';
import { EventDocument } from './schemas/event.schema';
import {
  PosthogEventType,
  PosthogEventTypeDocument,
} from './schemas/posthog-event-type.schema';
import { Segment } from '../segments/entities/segment.entity';
import { AudiencesService } from '../audiences/audiences.service';

export interface StartDto {
  accountId: string;
  workflowID: string;
}

export interface CustomEventDto {
  apiKey: string;
  eventDto: EventDto;
}

export interface PosthogEventDto {
  apiKey: string;
  eventDto: PosthogBatchEventDto;
}

@Processor('events')
@Injectable()
export class EventsProcessor {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectModel(Event.name)
    private EventModel: Model<EventDocument>,
    @Inject(AccountsService) private readonly userService: AccountsService,
    @Inject(WorkflowsService)
    private readonly workflowsService: WorkflowsService,
    @Inject(CustomersService)
    private readonly customersService: CustomersService,
    @Inject(AudiencesService) private audiencesService: AudiencesService,
    @InjectModel(PosthogEventType.name)
    private PosthogEventTypeModel: Model<PosthogEventTypeDocument>,
    @InjectConnection() private readonly connection: mongoose.Connection
  ) {}

  @Process('start')
  async processJourneyStart(job: Job<StartDto>) {
    const { accountId, workflowID } = job.data;

    let workflow: Workflow; // Workflow to update
    let audience: Audience; // Audience to freeze/send messages to
    let customers: CustomerDocument[]; // Customers to add to primary audience
    let jobIDs: (string | number)[] = [];

    const transactionSession = await this.connection.startSession();
    transactionSession.startTransaction();
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const account = await queryRunner.manager.findOneBy(Account, {
        id: accountId,
      });

      workflow = await queryRunner.manager.findOne(Workflow, {
        where: {
          owner: { id: account.id },
          id: workflowID,
        },
        relations: ['segment'],
      });
      if (!workflow) {
        this.logger.debug('Workflow does not exist');
        return Promise.reject(errors.ERROR_DOES_NOT_EXIST);
      }

      if (workflow.isActive) {
        this.logger.debug('Workflow already active');
        return Promise.reject(new Error('Workflow already active'));
      }
      if (workflow?.isStopped)
        return Promise.reject(
          new Error('The workflow has already been stopped')
        );
      if (!workflow?.segment)
        return Promise.reject(
          new Error('To start workflow segment should be defined')
        );

      const audiences = await queryRunner.manager.findBy(Audience, {
        workflow: { id: workflow.id },
      });

      for (let audience of audiences) {
        audience = await this.audiencesService.freeze(
          account,
          audience.id,
          queryRunner
        );
        this.logger.debug('Freezing audience ' + audience?.id);

        if (audience.isPrimary) {
          customers = await this.customersService.findByInclusionCriteria(
            account,
            workflow.segment.inclusionCriteria,
            transactionSession
          );
          this.logger.debug(
            'Customers to include in workflow: ' + customers.length
          );

          jobIDs = await this.audiencesService.moveCustomers(
            account,
            null,
            audience,
            customers,
            null,
            queryRunner
          );
          this.logger.debug('Finished moving customers into workflow');

          await queryRunner.manager.save(Workflow, {
            ...workflow,
            isActive: true,
          });
          this.logger.debug('Started workflow ' + workflow?.id);
        }
      }

      const segment = await queryRunner.manager.findOneBy(Segment, {
        id: workflow.segment.id,
      });
      await queryRunner.manager.save(Segment, { ...segment, isFreezed: true });

      await transactionSession.commitTransaction();
      await queryRunner.commitTransaction();
    } catch (err) {
      await transactionSession.abortTransaction();
      await queryRunner.rollbackTransaction();
      this.logger.error('Error: ' + err);
      return Promise.reject(err);
    } finally {
      await transactionSession.endSession();
      await queryRunner.release();
    }

    return Promise.resolve(jobIDs);
  }

  @Process('custom')
  async processCustomEvent(job: Job<CustomEventDto>) {
    const { apiKey, eventDto } = job.data;
    let account: Account, correlation: Correlation, jobIDs: WorkflowTick[];

    const transactionSession = await this.connection.startSession();
    transactionSession.startTransaction();
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      account = await this.userService.findOneByAPIKey(apiKey.substring(8));
      if (!account) this.logger.error('Account not found');
      this.logger.debug('Found Account: ' + account.id);

      correlation = await this.customersService.findOrCreateByCorrelationKVPair(
        account,
        eventDto,
        transactionSession
      );
      this.logger.debug('Correlation result:' + correlation.cust);

      if (!correlation.found)
        await this.workflowsService.enrollCustomer(
          account,
          correlation.cust,
          queryRunner
        );

      jobIDs = await this.workflowsService.tick(
        account,
        eventDto,
        queryRunner,
        transactionSession
      );
      this.logger.debug('Queued messages with jobID ' + jobIDs);
      if (eventDto) {
        await this.EventModel.create({
          ...eventDto,
          createdAt: new Date().toUTCString(),
        });
      }

      await transactionSession.commitTransaction();
      await queryRunner.commitTransaction();
    } catch (err) {
      await transactionSession.abortTransaction();
      await queryRunner.rollbackTransaction();
      this.logger.error('Error: ' + err);
      throw err;
    } finally {
      await transactionSession.endSession();
      await queryRunner.release();
    }

    console.log(jobIDs);
    return jobIDs;
  }

  @Process('posthog')
  async processPosthogEvent(job: Job<PosthogEventDto>) {
    const { apiKey, eventDto } = job.data;
    let account: Account, jobIds: WorkflowTick[]; // Account associated with the caller
    const transactionSession = await this.connection.startSession();
    transactionSession.startTransaction();
    const queryRunner = AppDataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    // Step 1: Find corresponding account
    let jobArray: WorkflowTick[] = []; // created jobId
    try {
      account = await this.userService.findOneByAPIKey(apiKey.substring(8));
      this.logger.debug('Found account: ' + account.id);

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
        const currentEvent = chronologicalEvents[numEvent];
        this.logger.debug(
          'Processing posthog event: ' + JSON.stringify(currentEvent, null, 2)
        );

        if (
          currentEvent.type === 'track' &&
          currentEvent.event &&
          currentEvent.event !== 'clicked'
        ) {
          const found = await this.PosthogEventTypeModel.findOne({
            name: currentEvent.event,
          })
            .session(transactionSession)
            .exec();
          if (!found) {
            await this.PosthogEventTypeModel.create(
              {
                name: currentEvent.event,
              },
              { session: transactionSession }
            );
          }
        }

        let jobIDs: WorkflowTick[] = [];
        //Step 2: Create/Correlate customer for each eventTemplatesService.queueMessage
        const postHogEventMapping = (event: any) => {
          const cust = {};
          if (event?.phPhoneNumber) {
            cust['phPhoneNumber'] = event.phPhoneNumber;
          }
          if (event?.phEmail) {
            cust['phEmail'] = event.phEmail;
          }
          if (event?.phCustom) {
            cust['phCustom'] = event.phCustom;
          }
          return cust;
        };

        const correlation = await this.customersService.findBySpecifiedEvent(
          account,
          'posthogId',
          currentEvent.userId,
          currentEvent,
          transactionSession,
          postHogEventMapping
        );

        if (!correlation.found) {
          await this.workflowsService.enrollCustomer(
            account,
            correlation.cust,
            queryRunner
          );
        }
        //need to change posthogeventdto to eventdo
        const convertedEventDto: EventDto = {
          correlationKey: 'posthogId',
          correlationValue: currentEvent.userId,
          event: currentEvent.context,
          source: 'posthog',
          payload: {
            type: currentEvent.type,
            event: currentEvent.event,
          },
        };

        //currentEvent
        jobIDs = await this.workflowsService.tick(
          account,
          convertedEventDto,
          queryRunner,
          transactionSession
        );
        this.logger.debug('Queued messages with jobIDs ' + jobIDs);
        jobArray = [...jobArray, ...jobIDs];
      }

      await transactionSession.commitTransaction();
      await queryRunner.commitTransaction();
    } catch (e) {
      await transactionSession.abortTransaction();
      await queryRunner.rollbackTransaction();
      this.logger.error('Error: ' + e);
      throw e;
    } finally {
      await transactionSession.endSession();
      await queryRunner.release();
    }

    return jobArray;
  }
}
