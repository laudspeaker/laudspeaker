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
    } catch (error) {
      console.log(error);
      throw new HttpException('Error getting job status', 503);
    }
  }

  @Post()
  @UseInterceptors(ClassSerializerInterceptor)
  async enginePayload(
    @Headers('Authorization') apiKey: string,
    @Body() body: EventDto
  ): Promise<void | { jobId: string } | HttpException> {
    let account: Account, correlation: Correlation, job: Job<any>;
    try {
      account = await this.userService.findOneByAPIKey(apiKey.substring(8));
      if (!account) this.logger.error('Account not found');
      this.logger.debug('Found Account: ' + account);
    } catch (err) {
      this.logger.error('Error: ' + err);
      return new HttpException(err, 500);
    }
    try {
      correlation = await this.customersService.findOrCreateByCorrelationKVPair(
        account,
        body
      );
    } catch (err) {
      this.logger.error('Error: ' + err);
      return new HttpException(err, 500);
    }
    if (!correlation.found) {
      try {
        this.workflowsService.enrollCustomer(account, correlation.cust);
      } catch (err) {
        this.logger.error('Error: ' + err);
        return new HttpException(err, 500);
      }
    }
    try {
      job = await this.workflowsService.tick(account, body);
      this.logger.debug('Queued messages with jobID ' + job);
      return {
        jobId: job.id as string,
      };
    } catch (err) {
      this.logger.error('Error: ' + err);
      return new HttpException(err, 500);
    }
  }
}
