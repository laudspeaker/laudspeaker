import { InjectQueue } from '@nestjs/bull';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  Controller,
  Post,
  LoggerService,
  Inject,
  UseInterceptors,
  ClassSerializerInterceptor,
  Body,
  Headers,
  HttpException,
} from '@nestjs/common';
import { Job, Queue } from 'bull';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Correlation, CustomersService } from '../customers/customers.service';
import * as _ from 'lodash';
import { WorkflowsService } from '../workflows/workflows.service';
import { AccountsService } from '../accounts/accounts.service';
import { Account } from '../accounts/entities/accounts.entity';
import { StatusJobDto } from './dto/status-event.dto';
import { PosthogBatchEventDto } from './dto/posthog-batch-event.dto';
import { PostHogEventDto } from './dto/posthog-event.dto';
import { CustomerDocument } from '../customers/schemas/customer.schema';
import { EventDto } from './dto/event.dto';
import { Stats } from '../audiences/entities/stats.entity';

@Controller('events')
export class EventsController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectQueue('email') private readonly emailQueue: Queue,
    @InjectQueue('slack') private readonly slackQueue: Queue,
    @InjectRepository(Stats) private statsRepository: Repository<Stats>,
    @Inject(AccountsService) private readonly userService: AccountsService,
    @Inject(WorkflowsService)
    private readonly workflowsService: WorkflowsService,
    @Inject(CustomersService)
    private readonly customersService: CustomersService
  ) {}

  @Post('job-status/email')
  @UseInterceptors(ClassSerializerInterceptor)
  async getJobEmailStatus(@Body() body: StatusJobDto): Promise<string> {
    const emailJob = await this.emailQueue.getJob(body.jobId);
    return await emailJob.getState();
  }

  @Post('job-status/slack')
  @UseInterceptors(ClassSerializerInterceptor)
  async getJobSlackStatus(@Body() body: StatusJobDto): Promise<string> {
    try {
      const slackJob = await this.slackQueue.getJob(body.jobId);
      const state = await slackJob.getState();
      return state;
    } catch (err) {
      this.logger.error('Error: ' + err);
      throw new HttpException('Error getting job status', 503);
    }
  }

  @Post('/posthog/')
  @UseInterceptors(ClassSerializerInterceptor)
  async getPostHogPayload(
    @Headers('Authorization') apiKey: string,
    @Body() body: PosthogBatchEventDto
  ) {
    let account: Account; // Account associated with the caller
    // Step 1: Find corresponding account
    try {
      account = await this.userService.findOneByAPIKey(apiKey.substring(8));
      this.logger.debug('Found account: ' + account.id);
    } catch (e) {
      this.logger.error('Error: ' + e);
      return new HttpException(e, 500);
    }

    let jobArray: (string | number)[] = []; // created jobId

    let chronologicalEvents: PostHogEventDto[];
    chronologicalEvents = body.batch.sort(
      (a, b) =>
        new Date(a.originalTimestamp).getTime() -
        new Date(b.originalTimestamp).getTime()
    );

    try {
      for (
        let numEvent = 0;
        numEvent < chronologicalEvents.length;
        numEvent++
      ) {
        const currentEvent = chronologicalEvents[numEvent];
        this.logger.debug(
          'Processing posthog event: ' + JSON.stringify(currentEvent, null, 2)
        );

        let jobIDs: (string | number)[] = [];
        let cust: CustomerDocument, // Customer document created/found on this API call
          found: boolean; // If the customer document was previously created
        //Step 2: Create/Correlate customer for each eventTemplatesService.queueMessage
        try {
          function postHogEventMapping(event: any) {
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
          }
          const correlation = await this.customersService.findBySpecifiedEvent(
            account,
            'posthogId',
            currentEvent.userId,
            currentEvent,
            postHogEventMapping
          );
          cust = correlation.cust;
          found = correlation.found;

          if (!correlation.found) {
            try {
              await this.workflowsService.enrollCustomer(account, correlation.cust);
            } catch (err) {
              this.logger.error('Error: ' + err);
              return new HttpException(err, 500);
            }
          }
          //need to change posthogeventdto to eventdo
          const convertedEventDto: EventDto = {
            correlationKey: 'posthogId',
            correlationValue: currentEvent.userId,
            event: currentEvent.event,
            source: 'posthog',
            payload: undefined,
          };

          //currentEvent
          try {
            jobIDs = await this.workflowsService.tick(
              account,
              convertedEventDto
            );
            this.logger.debug('Queued messages with jobIDs ' + jobIDs);
          } catch (err) {
            this.logger.error('Error: ' + err);
            return new HttpException(err, 500);
          }
        } catch (e) {
          this.logger.error('Error: ' + e);
          return new HttpException(e, 500);
        }
        jobArray = _.union(jobArray, jobIDs);
      }
    } catch (e) {
      this.logger.error('Error: ' + e);
      return new HttpException(e, 500);
    }
    return {
      jobArray,
    };
  }

  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
  async enginePayload(
    @Headers('Authorization') apiKey: string,
    @Body() body: EventDto
  ): Promise<(string | number)[] | HttpException> {
    let account: Account, correlation: Correlation, jobIDs: (string | number)[];
    try {
      account = await this.userService.findOneByAPIKey(apiKey.substring(8));
      if (!account) this.logger.error('Account not found');
      this.logger.debug('Found Account: ' + account.id);
    } catch (err) {
      this.logger.error('Error: ' + err);
      return new HttpException(err, 500);
    }
    try {
      correlation = await this.customersService.findOrCreateByCorrelationKVPair(
        account,
        body
      );
      this.logger.debug('Correlation result:' + correlation.cust);
    } catch (err) {
      this.logger.error('Error: ' + err);
      return new HttpException(err, 500);
    }
    if (!correlation.found) {
      try {
        await this.workflowsService.enrollCustomer(account, correlation.cust);
      } catch (err) {
        this.logger.error('Error: ' + err);
        return new HttpException(err, 500);
      }
    }
    try {
      jobIDs = await this.workflowsService.tick(account, body);
      this.logger.debug('Queued messages with jobID ' + jobIDs);
      return jobIDs;
    } catch (err) {
      this.logger.error('Error: ' + err);
      return new HttpException(err, 500);
    }
  }
}
