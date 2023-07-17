import { Inject, Injectable, LoggerService } from '@nestjs/common';
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
import { Between, DataSource, Repository } from 'typeorm';
import { Verification } from './api/auth/entities/verification.entity';
import { EventDocument } from './api/events/schemas/event.schema';
import { EventKeysDocument } from './api/events/schemas/event-keys.schema';
import { Event } from './api/events/schemas/event.schema';
import { EventKeys } from './api/events/schemas/event-keys.schema';
import { JobsService } from './api/jobs/jobs.service';
import { WorkflowsService } from './api/workflows/workflows.service';
import { TimeJobStatus } from './api/jobs/entities/job.entity';
import { IntegrationsService } from './api/integrations/integrations.service';
import {
  Integration,
  IntegrationStatus,
} from './api/integrations/entities/integration.entity';
import { Recovery } from './api/auth/entities/recovery.entity';
import { WebhookJobsService } from './api/webhook-jobs/webhook-jobs.service';
import {
  WebhookJobStatus,
  WebhookProvider,
} from './api/webhook-jobs/entities/webhook-job.entity';
import { AccountsService } from './api/accounts/accounts.service';
import Mailgun from 'mailgun.js';
import formData from 'form-data';
import { createClient } from '@clickhouse/client';
import {
  ClickHouseEventProvider,
  ClickHouseMessage,
} from './api/webhooks/webhooks.service';
import twilio from 'twilio';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import client from '@sendgrid/client';
import { ModalsService } from './api/modals/modals.service';
import { randomUUID } from 'crypto';
import { StepsService } from './api/steps/steps.service';
import { StepType } from './api/steps/types/step.interface';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

const BATCH_SIZE = 500;
const KEYS_TO_SKIP = ['__v', '_id', 'audiences', 'ownerId'];

const MAX_DATE = new Date(8640000000000000);
const MIN_DATE = new Date(0);

@Injectable()
export class CronService {
  private clickHouseClient = createClient({
    host: process.env.CLICKHOUSE_HOST
      ? process.env.CLICKHOUSE_HOST.includes('http')
        ? process.env.CLICKHOUSE_HOST
        : `http://${process.env.CLICKHOUSE_HOST}`
      : 'http://localhost:8123',
    username: process.env.CLICKHOUSE_USER ?? 'default',
    password: process.env.CLICKHOUSE_PASSWORD ?? '',
  });

  constructor(
    private dataSource: DataSource,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectModel(Customer.name)
    private customerModel: Model<CustomerDocument>,
    @InjectModel(CustomerKeys.name)
    private customerKeysModel: Model<CustomerKeysDocument>,
    @InjectModel(Event.name)
    private eventModel: Model<EventDocument>,
    @InjectModel(EventKeys.name)
    private eventKeysModel: Model<EventKeysDocument>,
    @InjectRepository(Integration)
    private integrationsRepository: Repository<Integration>,
    @InjectRepository(Verification)
    private verificationRepository: Repository<Verification>,
    @InjectRepository(Recovery)
    public readonly recoveryRepository: Repository<Recovery>,
    @Inject(JobsService) private jobsService: JobsService,
    @Inject(IntegrationsService)
    private integrationsService: IntegrationsService,
    @Inject(WorkflowsService) private workflowsService: WorkflowsService,
    @Inject(WebhookJobsService) private webhookJobsService: WebhookJobsService,
    @Inject(AccountsService) private accountsService: AccountsService,
    @Inject(ModalsService) private modalsService: ModalsService,
    @Inject(StepsService) private stepsService: StepsService,
    @InjectQueue('transition') private readonly transitionQueue: Queue
  ) {}

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: CronService.name,
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
        class: CronService.name,
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
        class: CronService.name,
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
        class: CronService.name,
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
        class: CronService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleCustomerKeysCron() {
    const session = randomUUID();
    try {
      let current = 0;
      const documentsCount = await this.customerModel
        .estimatedDocumentCount()
        .exec();

      const keys: Record<string, any[]> = {};
      const keyCustomerMap: Record<string, Set<string>> = {};

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
              keyCustomerMap[key].add(customer.ownerId);
              continue;
            }

            keys[key] = [obj[key]];
            keyCustomerMap[key] = new Set([customer.ownerId]);
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

        for (const ownerId of keyCustomerMap[key].values()) {
          await this.customerKeysModel
            .updateOne(
              { key, ownerId },
              {
                $set: {
                  key,
                  type,
                  isArray,
                  ownerId,
                },
              },
              { upsert: true }
            )
            .exec();
        }
      }
    } catch (e) {
      this.error(e, this.handleCustomerKeysCron.name, session);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleEventKeysCron() {
    const session = randomUUID();
    try {
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
          const obj = (event.toObject() as any)?.event || {};
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
        }
        await this.eventKeysModel.insertMany(batchToSave);
      }
    } catch (e) {
      this.error(e, this.handleEventKeysCron.name, session);
    }
  }

  @Cron(CronExpression.EVERY_HOUR)
  async handleVerificationCheck() {
    const session = randomUUID();
    try {
      await this.verificationRepository
        .createQueryBuilder()
        .where(
          `verification.status = 'sent' AND now() > verification."createdAt"::TIMESTAMP + INTERVAL '1 HOUR'`
        )
        .update({ status: 'expired' })
        .execute();
    } catch (e) {
      this.error(e, this.handleVerificationCheck.name, session);
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

  @Cron(CronExpression.EVERY_MINUTE)
  async handleTimeBasedSteps() {
    let err;
    const session = randomUUID();
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      let steps = await this.stepsService.transactionalFindAllActiveByType(
        null,
        StepType.TIME_DELAY,
        session,
        queryRunner
      );
      steps.push(
        ...(await this.stepsService.transactionalFindAllActiveByType(
          null,
          StepType.TIME_WINDOW,
          session,
          queryRunner
        ))
      );
      steps.push(
        ...(await this.stepsService.transactionalFindAllActiveByType(
          null,
          StepType.WAIT_UNTIL_BRANCH,
          session,
          queryRunner
        ))
      );
      for (let i = 0; i < steps.length; i++) {
        let branch;
        if (steps[i].type === StepType.WAIT_UNTIL_BRANCH) {
          if (!steps[i].metadata.timeBranch) continue;
          branch = -1;
        }
        if (steps[i].customers.length > 0)
          this.transitionQueue.add(steps[i].type, {
            step: steps[i],
            ownerID: steps[i].owner.id,
            session: session,
            branch,
          });
      }
      await queryRunner.commitTransaction();
    } catch (e) {
      err = e;
      this.error(e, this.handleTimeBasedSteps.name, session);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
      if (err) throw err;
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  async handleMissedMailgunEvents() {
    const session = randomUUID();
    try {
      // Get all pending Mailgun Jobs and accounts
      const mailgunJobs = await this.webhookJobsService.findAllByProvider(
        WebhookProvider.MAILGUN
      );
      const accounts = await this.accountsService.findAll();

      // Create new pending Mailgun Job
      await this.webhookJobsService.create({
        provider: WebhookProvider.MAILGUN,
        status: WebhookJobStatus.PENDING,
      });

      // Iterate through Jobs
      for (let i = 0; i < mailgunJobs.length; i++) {
        const startTime = mailgunJobs[i].createdAt;

        // Update job status
        await this.webhookJobsService.update(mailgunJobs[i].id, {
          status: WebhookJobStatus.IN_PROGRESS,
        });

        //Iterate through accounts
        for (let j = 0; j < accounts.length; j++) {
          if (accounts[j].mailgunAPIKey && accounts[j].sendingDomain) {
            const mailgun = new Mailgun(formData);
            const mg = mailgun.client({
              username: 'api',
              key: accounts[j].mailgunAPIKey,
            });
            let query, events;
            query = {
              begin: startTime.toUTCString(),
              limit: 300,
              ascending: 'yes',
            };
            do {
              events = await mg.events.get(accounts[j].sendingDomain, query);
              for (let k = 0; k < events.items.length; k++) {
                const existsCheck = await this.clickHouseClient.query({
                  query: `SELECT * FROM message_status WHERE event = {event:String} AND messageId = {messageId:String}`,
                  query_params: {
                    event: events.items[k].event,
                    messageId: events.items[k].message.headers['message-id'],
                  },
                });
                const existsRows = JSON.parse(await existsCheck.text());
                if (existsRows.data.length == 0) {
                  const messageInfo = await this.clickHouseClient.query({
                    query: `SELECT * FROM message_status WHERE messageId = {messageId:String} AND audienceId IS NOT NULL AND customerId IS NOT NULL AND templateId IS NOT NULL LIMIT 1`,
                    query_params: {
                      messageId: events.items[k].message.headers['message-id'],
                    },
                  });
                  const messageRow = JSON.parse(await messageInfo.text()).data;
                  const messagesToInsert: ClickHouseMessage[] = [];
                  const clickHouseRecord: ClickHouseMessage = {
                    userId: accounts[j].id,
                    audienceId: messageRow[0]?.audienceId,
                    customerId: messageRow[0]?.customerId,
                    templateId: messageRow[0]?.templateId,
                    messageId: events.items[k].message.headers['message-id'],
                    event: events.items[k].event,
                    eventProvider: ClickHouseEventProvider.MAILGUN,
                    createdAt: new Date(
                      events.items[k].timestamp * 1000
                    ).toUTCString(),
                    processed: false,
                  };
                  messagesToInsert.push(clickHouseRecord);
                  await this.clickHouseClient.insert<ClickHouseMessage>({
                    table: 'message_status',
                    values: messagesToInsert,
                    format: 'JSONEachRow',
                  });
                }
              }
              query = { page: events.pages.next.number };
            } while (events?.items?.length > 0 && query.page);
          }
        }
        await this.webhookJobsService.remove(mailgunJobs[i].id);
      }
    } catch (err) {
      this.error(err, this.handleMissedMailgunEvents.name, session);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  async handleMissedSendgridEvents() {
    const session = randomUUID();
    try {
      // Get all pending Twilio Jobs and accounts
      const sendgridJobs = await this.webhookJobsService.findAllByProvider(
        WebhookProvider.SENDGRID
      );
      const accounts = await this.accountsService.findAll();

      // Create new pending Twilio Job
      await this.webhookJobsService.create({
        provider: WebhookProvider.SENDGRID,
        status: WebhookJobStatus.PENDING,
      });

      // Iterate through Jobs
      for (let i = 0; i < sendgridJobs.length; i++) {
        // Update job status
        await this.webhookJobsService.update(sendgridJobs[i].id, {
          status: WebhookJobStatus.IN_PROGRESS,
        });

        //Iterate through accounts
        for (let j = 0; j < accounts.length; j++) {
          if (accounts[j].sendgridApiKey) {
            client.setApiKey(accounts[j].sendgridApiKey);
            const resultSet = await this.clickHouseClient.query({
              query: `SELECT * FROM message_status WHERE processed = false AND eventProvider = 'sendgrid' AND userId = {userId:String}`,
              query_params: { userId: accounts[j].id },
              format: 'JSONEachRow',
            });
            for await (const rows of resultSet.stream()) {
              rows.forEach(async (row) => {
                const rowObject = JSON.parse(row.text);
                // Step 1: Check if the message has already reached an end state: delivered, undelivered, failed, canceled
                const existsCheck = await this.clickHouseClient.query({
                  query: `SELECT * FROM message_status WHERE event IN ('dropped', 'bounce', 'blocked', 'open', 'click', 'spamreport', 'unsubscribe','group_unsubscribe','group_resubscribe') AND messageId = {messageId:String}`,
                  query_params: { messageId: rowObject.messageId },
                });
                const existsRows = JSON.parse(await existsCheck.text());

                // If not reached end state, check if reached end state using API
                if (existsRows.data.length === 0) {
                  let message;
                  try {
                    const response: any = await client.request({
                      url: `/v3/messages`,
                      method: 'GET',
                      qs: {
                        query: `msg_id=${rowObject.messageId}`,
                      },
                    });
                    message = response.body.messages[0];
                  } catch (err) {
                    // User is unauthorized to use events api, so we return
                    return;
                  }

                  // Reached end state using API; update end state and set as processed in clickhouse
                  if (
                    ['delivered', 'dropped', 'bounce', 'blocked'].includes(
                      message.status
                    )
                  ) {
                    const messagesToInsert: ClickHouseMessage[] = [];
                    const clickHouseRecord: ClickHouseMessage = {
                      audienceId: rowObject.audienceId,
                      customerId: rowObject.customerId,
                      templateId: rowObject.templateId,
                      messageId: rowObject.messageId,
                      event: message.status,
                      eventProvider: ClickHouseEventProvider.TWILIO,
                      createdAt: new Date().toUTCString(),
                      userId: accounts[j].id,
                      processed: false,
                    };
                    messagesToInsert.push(clickHouseRecord);
                    await this.clickHouseClient.insert<ClickHouseMessage>({
                      table: 'message_status',
                      values: messagesToInsert,
                      format: 'JSONEachRow',
                    });
                    await this.clickHouseClient.query({
                      query: `ALTER TABLE message_status UPDATE processed=true WHERE eventProvider='sendgrid' AND event = 'sent' AND messageId = {messageId:String} AND templateId = {templateId:String} AND customerId = {customerId:String} AND audienceId = {audienceId:String}`,
                      query_params: {
                        messageId: rowObject.messageId,
                        templateId: rowObject.templateId,
                        customerId: rowObject.customerId,
                        audienceId: rowObject.audienceId,
                      },
                    });
                  }
                  //Has not reached end state; do nothing
                }
                // Has reached end state using webhooks; update processed = true
                else {
                  await this.clickHouseClient.query({
                    query: `ALTER TABLE message_status UPDATE processed=true WHERE eventProvider='sendgrid' AND event = 'sent' AND messageId = {messageId:String} AND templateId = {templateId:String} AND customerId = {customerId:String} AND audienceId = {audienceId:String}`,
                    query_params: {
                      messageId: rowObject.messageId,
                      templateId: rowObject.templateId,
                      customerId: rowObject.customerId,
                      audienceId: rowObject.audienceId,
                    },
                  });
                }
              });
            }
          }
        }
        await this.webhookJobsService.remove(sendgridJobs[i].id);
      }
    } catch (err) {
      this.error(err, this.handleMissedSendgridEvents.name, session);
    }
  }

  @Cron(CronExpression.EVERY_DAY_AT_NOON)
  async handleMissedTwilioEvents() {
    const session = randomUUID();
    try {
      // Get all pending Twilio Jobs and accounts
      const twilioJobs = await this.webhookJobsService.findAllByProvider(
        WebhookProvider.TWILIO_SMS
      );
      const accounts = await this.accountsService.findAll();

      // Create new pending Twilio Job
      await this.webhookJobsService.create({
        provider: WebhookProvider.TWILIO_SMS,
        status: WebhookJobStatus.PENDING,
      });

      // Iterate through Jobs
      for (let i = 0; i < twilioJobs.length; i++) {
        // Update job status
        await this.webhookJobsService.update(twilioJobs[i].id, {
          status: WebhookJobStatus.IN_PROGRESS,
        });

        //Iterate through accounts
        for (let j = 0; j < accounts.length; j++) {
          if (accounts[j].smsAccountSid && accounts[j].smsAuthToken) {
            const twilioClient = twilio(
              accounts[j].smsAccountSid,
              accounts[j].smsAuthToken
            );
            const resultSet = await this.clickHouseClient.query({
              query: `SELECT * FROM message_status WHERE processed = false AND eventProvider = 'twilio' AND userId = {userId:String}`,
              query_params: { userId: accounts[j].id },
              format: 'JSONEachRow',
            });
            for await (const rows of resultSet.stream()) {
              rows.forEach(async (row) => {
                const rowObject = JSON.parse(row.text);
                // Step 1: Check if the message has already reached an end state: delivered, undelivered, failed, canceled
                const existsCheck = await this.clickHouseClient.query({
                  query: `SELECT * FROM message_status WHERE event IN ('delivered', 'undelivered', 'failed', 'canceled') AND messageId = {messageId:String}`,
                  query_params: { messageId: rowObject.messageId },
                });
                const existsRows = JSON.parse(await existsCheck.text());
                if (existsRows.data.length === 0) {
                  const message = await twilioClient
                    .messages(rowObject.messageId)
                    .fetch();
                  if (
                    ['delivered', 'undelivered', 'failed', 'canceled'].includes(
                      message.status
                    )
                  ) {
                    const messagesToInsert: ClickHouseMessage[] = [];
                    const clickHouseRecord: ClickHouseMessage = {
                      audienceId: rowObject.audienceId,
                      customerId: rowObject.customerId,
                      templateId: rowObject.templateId,
                      messageId: rowObject.messageId,
                      event: message.status,
                      eventProvider: ClickHouseEventProvider.TWILIO,
                      createdAt: new Date().toUTCString(),
                      userId: accounts[j].id,
                      processed: false,
                    };
                    messagesToInsert.push(clickHouseRecord);
                    await this.clickHouseClient.insert<ClickHouseMessage>({
                      table: 'message_status',
                      values: messagesToInsert,
                      format: 'JSONEachRow',
                    });
                    await this.clickHouseClient.query({
                      query: `ALTER TABLE message_status UPDATE processed=true WHERE eventProvider='twilio' AND event = 'sent' AND messageId = {messageId:String} AND templateId = {templateId:String} AND customerId = {customerId:String} AND audienceId = {audienceId:String}`,
                      query_params: {
                        messageId: rowObject.messageId,
                        templateId: rowObject.templateId,
                        customerId: rowObject.customerId,
                        audienceId: rowObject.audienceId,
                      },
                    });
                  }
                } else {
                  await this.clickHouseClient.query({
                    query: `ALTER TABLE message_status UPDATE processed=true WHERE eventProvider='twilio' AND event = 'sent' AND messageId = {messageId:String} AND templateId = {templateId:String} AND customerId = {customerId:String} AND audienceId = {audienceId:String}`,
                    query_params: {
                      messageId: rowObject.messageId,
                      templateId: rowObject.templateId,
                      customerId: rowObject.customerId,
                      audienceId: rowObject.audienceId,
                    },
                  });
                }
              });
            }
          }
        }
        await this.webhookJobsService.remove(twilioJobs[i].id);
      }
    } catch (err) {
      this.error(err, this.handleMissedTwilioEvents.name, session);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleRecovery() {
    const session = randomUUID();
    try {
      await this.recoveryRepository
        .createQueryBuilder()
        .where(`now() > recovery."createdAt"::TIMESTAMP + INTERVAL '1 HOUR'`)
        .delete()
        .execute();
    } catch (e) {
      this.error(e, this.handleRecovery.name, session);
    }
  }

  @Cron(CronExpression.EVERY_MINUTE)
  async handleExpiredModalEvents() {
    const session = randomUUID();
    try {
      await this.modalsService.deleteExpiredModalEvents();
    } catch (e) {
      this.error(e, this.handleExpiredModalEvents.name, session);
    }
  }
}
