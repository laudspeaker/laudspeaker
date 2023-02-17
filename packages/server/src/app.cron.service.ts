import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import {
  Customer,
  CustomerDocument,
} from './api/customers/schemas/customer.schema';
import { getType } from 'tst-reflect';
import {
  CustomerKeys,
  CustomerKeysDocument,
} from './api/customers/schemas/customer-keys.schema';
import { isDateString, isEmail } from 'class-validator';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './api/accounts/entities/accounts.entity';
import { Between, Repository } from 'typeorm';
import { Verification } from './api/auth/entities/verification.entity';
import { EventDocument } from './api/events/schemas/event.schema';
import { EventKeysDocument } from './api/events/schemas/event-keys.schema';
import { Event } from './api/events/schemas/event.schema';
import { EventKeys } from './api/events/schemas/event-keys.schema';
import { JobsService } from './api/jobs/jobs.service';
import { WorkflowsService } from './api/workflows/workflows.service';
import { TimeJobStatus } from './api/jobs/entities/job.entity';
import { IntegrationsService } from './api/integrations/integrations.service';

const BATCH_SIZE = 500;
const KEYS_TO_SKIP = ['__v', '_id', 'audiences', 'ownerId'];

const MAX_DATE = new Date(8640000000000000);
const MIN_DATE = new Date(0);

@Injectable()
export class CronService {
  private readonly logger = new Logger(CronService.name);

  constructor(
    @InjectModel(Customer.name)
    private customerModel: Model<CustomerDocument>,
    @InjectModel(CustomerKeys.name)
    private customerKeysModel: Model<CustomerKeysDocument>,
    @InjectModel(Event.name)
    private eventModel: Model<EventDocument>,
    @InjectModel(EventKeys.name)
    private eventKeysModel: Model<EventKeysDocument>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @InjectRepository(Verification)
    private verificationRepository: Repository<Verification>,
    @Inject(JobsService) private jobsService: JobsService,
    @Inject(WorkflowsService) private workflowsService: WorkflowsService
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async handleCustomerKeysCron() {
    try {
      this.logger.log('Cron customer keys job started');
      let current = 0;
      const documentsCount = await this.customerModel
        .estimatedDocumentCount()
        .exec();

      const keys: Record<string, any[]> = {};

      while (current < documentsCount) {
        const batch = await this.customerModel
          .find()
          .skip(current)
          .limit(BATCH_SIZE)
          .exec();

        batch.forEach((customer) => {
          const obj = customer.toObject();
          for (const key of Object.keys(obj)) {
            if (KEYS_TO_SKIP.includes(key)) continue;

            if (keys[key]) {
              keys[key].push(obj[key]);
              continue;
            }

            keys[key] = [obj[key]];
          }
        });
        current += BATCH_SIZE;
      }

      for (const key of Object.keys(keys)) {
        const validItem = keys[key].find(
          (item) => item !== '' && item !== undefined && item !== null
        );

        if (validItem === '' || validItem === undefined || validItem === null)
          continue;

        const keyType = getType(validItem);
        const isArray = keyType.isArray();
        let type = isArray ? getType(validItem[0]).name : keyType.name;

        if (type === 'String') {
          if (isEmail(validItem)) type = 'Email';
          if (isDateString(validItem)) type = 'Date';
        }

        await this.customerKeysModel
          .updateOne(
            { key },
            {
              $set: {
                key,
                type,
                isArray,
              },
            },
            { upsert: true }
          )
          .exec();
      }

      this.logger.log(
        `Cron customer keys job finished, checked ${documentsCount} records, found ${
          Object.keys(keys).length
        } keys`
      );
    } catch (e) {
      this.logger.error('Cron error: ' + e);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleEventKeysCron() {
    try {
      this.logger.log('Cron event keys job started');
      let current = 0;
      const documentsCount = await this.eventModel
        .estimatedDocumentCount()
        .exec();

      const keys: Record<string, { value: any; ownerId: string }[]> = {};

      while (current < documentsCount) {
        const batch = await this.eventModel
          .find()
          .skip(current)
          .limit(BATCH_SIZE)
          .exec();

        batch.forEach((event) => {
          const ownerId = event.ownerId;
          const obj = event.toObject()?.event || {};
          for (const key of Object.keys(obj)) {
            if (KEYS_TO_SKIP.includes(key)) continue;

            if (keys[key]) {
              keys[key].push({ value: obj[key], ownerId });
              continue;
            }

            keys[key] = [{ value: obj[key], ownerId }];
          }
        });

        current += BATCH_SIZE;
      }

      for (const key of Object.keys(keys)) {
        const validItems = keys[key].filter(
          (item) =>
            item.value !== '' && item.value !== undefined && item.value !== null
        );

        if (!validItems.length) continue;

        let batchToSave = [];
        for (const validItem of validItems) {
          const keyType = getType(validItem.value);
          const isArray = keyType.isArray();
          let type = isArray ? getType(validItem.value[0]).name : keyType.name;

          if (type === 'String') {
            if (isEmail(validItem.value)) type = 'Email';
            if (isDateString(validItem.value)) type = 'Date';
          }

          const eventKey = {
            key,
            type,
            isArray,
            ownerId: validItem.ownerId,
          };

          const foundEventKey = await this.eventKeysModel
            .findOne(eventKey)
            .exec();

          if (!foundEventKey) {
            batchToSave.push(eventKey);
          }

          if (batchToSave.length > BATCH_SIZE) {
            await this.eventKeysModel.insertMany(batchToSave);
            batchToSave = [];
          }

          // await this.eventKeysModel
          //   .updateOne(
          //     { key },
          //     {
          //       $set: eventKey,
          //     },
          //     { upsert: true }
          //   )
          //   .exec();
        }

        await this.eventKeysModel.insertMany(batchToSave);
      }

      this.logger.log(
        `Cron event keys job finished, checked ${documentsCount} records, found ${
          Object.keys(keys).length
        } keys`
      );
    } catch (e) {
      this.logger.error('Cron error: ' + e);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleVerificationCheck() {
    try {
      await this.verificationRepository
        .createQueryBuilder()
        .where(
          `verification.status = 'sent' AND now() > verification."createdAt"::TIMESTAMP + INTERVAL '1 HOUR'`
        )
        .update({ status: 'expired' })
        .execute();
    } catch (e) {
      this.logger.error('Cron error: ' + e);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleIntegrations() {
    const integrationsNumber = await this.integrationsRepository.countBy({
      status: IntegrationStatus.ACTIVE,
    });

    let offset = 0;

    while (offset < integrationsNumber) {
      const integrationsBatch = await this.integrationsRepository.find({
        where: { status: IntegrationStatus.ACTIVE },
        relations: ['database', 'owner'],
        take: BATCH_SIZE,
        skip: offset,
      });

      for (const integration of integrationsBatch) {
        await this.integrationsService.handleIntegration(integration);
      }

      offset += BATCH_SIZE;
    }
  }

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleTimeTriggers() {
    try {
      const date = new Date();
      const jobs = await this.jobsService.jobsRepository.find({
        where: [
          { executionTime: Between(MIN_DATE, date) },
          {
            startTime: Between(MIN_DATE, date),
            endTime: Between(date, MAX_DATE),
            workflow: {
              isActive: true,
              isDeleted: false,
              isPaused: false,
              isStopped: false,
            },
            status: TimeJobStatus.PENDING,
          },
        ],
        relations: ['owner', 'from', 'to', 'workflow'],
      });
      this.logger.debug('Found jobs:' + JSON.stringify(jobs));
      for (const job of jobs) {
        try {
          await this.jobsService.jobsRepository.save({
            ...job,
            status: TimeJobStatus.IN_PROGRESS,
          });
          await this.workflowsService.timeTick(job);
          await this.jobsService.jobsRepository.delete({ id: job.id });
        } catch (e) {
          this.logger.error('Time job error: ' + e);
        }
      }
    } catch (e) {
      this.logger.error('Cron error: ' + e);
    }
  }
}
