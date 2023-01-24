import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Cron, CronExpression } from '@nestjs/schedule';
import { Model } from 'mongoose';
import {
  Customer,
  CustomerDocument,
} from './api/customers/schemas/customer.schema';
import FormData from 'form-data';
import { getType } from 'tst-reflect';
import {
  CustomerKeys,
  CustomerKeysDocument,
} from './api/customers/schemas/customer-keys.schema';
import { isDateString, isEmail } from 'class-validator';
import Mailgun from 'mailgun.js';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from './api/accounts/entities/accounts.entity';
import { IsNull, Not, Repository } from 'typeorm';
import { createClient } from '@clickhouse/client';
import { Verification } from './api/auth/entities/verification.entity';
import { WebhookEvent } from './api/webhooks/entities/webhook-event.entity';
import { EventDocument } from './api/events/schemas/event.schema';
import { EventKeysDocument } from './api/events/schemas/event-keys.schema';
import { Event } from './api/events/schemas/event.schema';
import {
  EventKeys,
  EventKeysSchema,
} from './api/events/schemas/event-keys.schema';
import { JobsService } from './api/jobs/jobs.service';
import { WorkflowsService } from './api/workflows/workflows.service';

const client = createClient({
  host: process.env.CLICKHOUSE_HOST ?? 'http://localhost:8123',
  username: process.env.CLICKHOUSE_USER ?? 'default',
  password: process.env.CLICKHOUSE_PASSWORD ?? '',
});

const createTableQuery = `
CREATE TABLE IF NOT EXISTS message_status
(audienceId UUID, customerId String, messageId String, event String, eventProvider String, createdAt DateTime) 
ENGINE = ReplacingMergeTree
PRIMARY KEY (audienceId, customerId, messageId, event)`;

interface ClickHouseMessage {
  audienceId: string;
  customerId: string;
  messageId: string;
  event: string;
  eventProvider: 'mailgun' | 'sendgrid' | 'twillio';
  createdAt: string;
}

const createTable = async () => {
  await client.query({ query: createTableQuery });
};

const getLastFetchedEventTimestamp = async () => {
  return await client.query({
    query: `SELECT MAX(createdAt) FROM message_status`,
  });
};

const insertMessages = async (values: ClickHouseMessage[]) => {
  await client.insert<ClickHouseMessage>({
    table: 'message_status',
    values,
    format: 'JSONEachRow',
  });
};

const BATCH_SIZE = 500;
const KEYS_TO_SKIP = ['__v', '_id', 'audiences', 'ownerId'];

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
    @InjectRepository(WebhookEvent)
    private webhookEventRepository: Repository<WebhookEvent>,
    @Inject(JobsService) private jobsService: JobsService,
    @Inject(WorkflowsService) private workflowsService: WorkflowsService
  ) {
    (async () => {
      try {
        await createTable();
      } catch (e) {
        console.error(e);
      }
    })();
  }

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

      const keys: Record<string, any[]> = {};

      while (current < documentsCount) {
        const batch = await this.eventModel
          .find()
          .skip(current)
          .limit(BATCH_SIZE)
          .exec();

        batch.forEach((event) => {
          const obj = event.toObject()?.event || {};
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
        const validItems = keys[key].filter(
          (item) => item !== '' && item !== undefined && item !== null
        );

        if (!validItems.length) continue;

        let batchToSave = [];
        for (const validItem of validItems) {
          const keyType = getType(validItem);
          const isArray = keyType.isArray();
          let type = isArray ? getType(validItem[0]).name : keyType.name;

          if (type === 'String') {
            if (isEmail(validItem)) type = 'Email';
            if (isDateString(validItem)) type = 'Date';
          }

          const eventKey = {
            key,
            type,
            isArray,
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

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async handleClickHouseCron() {
    try {
      const response = await getLastFetchedEventTimestamp();
      const data = (
        await response.json<{ data?: { ['max(createdAt)']: string }[] }>()
      )?.data;
      const dateInDB = data?.[0]?.['max(createdAt)'];
      const lastEventFetch =
        new Date(
          new Date(dateInDB).getTime() -
            new Date().getTimezoneOffset() * 60 * 1000
        ) || new Date('2000-10-10');

      const mailgun = new Mailgun(FormData);

      const accountsNumber = await this.accountRepository.count({
        where: {
          mailgunAPIKey: Not(IsNull()),
        },
      });
      let offset = 0;

      while (offset < accountsNumber) {
        const accountsBatch = await this.accountRepository.find({
          take: BATCH_SIZE,
          where: {
            mailgunAPIKey: Not(IsNull()),
          },
          skip: offset,
        });

        for (const account of accountsBatch) {
          try {
            const mg = mailgun.client({
              username: 'api',
              key: account.mailgunAPIKey,
            });

            let events = await mg.events.get(account.sendingDomain, {
              begin: new Date(lastEventFetch.getTime() + 1000).toUTCString(),
              ascending: 'yes',
            });

            const batchToSave: ClickHouseMessage[] = [];

            for (const item of events.items) {
              const { audienceId, customerId } = item['user-variables'];
              if (!audienceId || !customerId) continue;
              const event = item.event;
              const messageId = item.message.headers['message-id'];
              const createdAt = new Date(item.timestamp * 1000).toUTCString();
              batchToSave.push({
                audienceId,
                customerId,
                event,
                eventProvider: 'mailgun',
                messageId,
                createdAt,
              });
            }

            let page = events.pages.next.number;
            let lastEventTimestamp =
              events.items[events.items.length - 1]?.timestamp * 1000;

            while (
              lastEventTimestamp &&
              new Date(lastEventTimestamp) > lastEventFetch
            ) {
              events = await mg.events.get(account.sendingDomain, {
                begin: new Date(lastEventFetch.getTime() + 1000).toUTCString(),
                ascending: 'yes',
                page,
              });

              for (const item of events.items) {
                const { audienceId, customerId } = item['user-variables'];
                if (!audienceId || !customerId) continue;
                const event = item.event;
                const messageId = item.message.headers['message-id'];
                const createdAt = new Date(item.timestamp * 1000).toUTCString();
                batchToSave.push({
                  audienceId,
                  customerId,
                  event,
                  eventProvider: 'mailgun',
                  messageId,
                  createdAt,
                });
              }

              lastEventTimestamp =
                events.items[events.items.length - 1]?.timestamp * 1000;

              page = events.pages.next.number;
            }
            await insertMessages(batchToSave);
          } catch (e) {
            this.logger.error(e);
          }
        }
        offset += BATCH_SIZE;
      }

      /**
       * sendgrid & twillio
       */

      let batch = await this.webhookEventRepository.find({
        take: BATCH_SIZE,
        relations: ['audience'],
      });
      while (batch.length > 0) {
        await insertMessages(
          batch.map((item) => ({
            ...item,
            audienceId: item.audience.id,
            audience: undefined,
          }))
        );

        for (const item of batch) {
          await this.webhookEventRepository.delete({
            id: item.id,
          });
        }

        batch = await this.webhookEventRepository.find({
          take: BATCH_SIZE,
        });
      }
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

  @Cron(CronExpression.EVERY_10_SECONDS)
  async handleTimeTriggers() {
    try {
      const jobs = await this.jobsService.findAllByDate(new Date());
      this.logger.debug('Found jobs:' + jobs);
      for (const job of jobs) {
        await this.workflowsService.timeTick(job);
        await this.jobsService.jobsRepository.delete({ id: job.id });
      }
    } catch (e) {
      this.logger.error('Cron error: ' + e);
    }
  }
}
