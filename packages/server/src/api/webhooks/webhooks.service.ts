import { ForbiddenException, Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PublicKey, Signature, Ecdsa } from 'starkbank-ecdsa';
import { Audience } from '../audiences/entities/audience.entity';
import { Account } from '../accounts/entities/accounts.entity';
import { createHmac } from 'crypto';
import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common/exceptions';
import { createClient } from '@clickhouse/client';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import Mailgun from 'mailgun.js';
import formData from 'form-data';
import axios from 'axios';
import FormData from 'form-data';
import { randomUUID } from 'crypto';
import { Step } from '../steps/entities/step.entity';
import { KafkaProducerService } from '../kafka/producer.service';
import { Message } from 'kafkajs';
import { KAFKA_TOPIC_MESSAGE_STATUS } from '../kafka/constants';
import { EventWebhook } from '@sendgrid/eventwebhook';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Webhook } from 'svix';

export enum ClickHouseEventProvider {
  MAILGUN = 'mailgun',
  SENDGRID = 'sendgrid',
  TWILIO = 'twilio',
  SLACK = 'slack',
  PUSH = 'PUSH',
  WEBHOOKS = 'webhooks',
  TRACKER = 'tracker',
  RESEND = 'resend',
}

export interface ClickHouseMessage {
  audienceId?: string;
  stepId?: string;
  createdAt: string;
  customerId: string;
  event: string;
  eventProvider: ClickHouseEventProvider;
  messageId: string;
  templateId: string;
  workspaceId: string;
  processed: boolean;
}

@Injectable()
export class WebhooksService {
  private MAILGUN_HOOKS_TO_INSTALL = [
    'clicked',
    'complained',
    'delivered',
    'opened',
    'permanent_fail',
    'temporary_fail',
    'unsubscribed',
  ];

  private sendgridEventsMap = {
    click: 'clicked',
    open: 'opened',
  };

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @InjectRepository(Step)
    private stepRepository: Repository<Step>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @Inject(KafkaProducerService)
    private kafkaService: KafkaProducerService,
    @InjectQueue('events_pre')
    private readonly eventPreprocessorQueue: Queue
  ) {
    const session = randomUUID();
    (async () => {
      try {
        if (process.env.MAILGUN_API_KEY && process.env.MAILGUN_TEST_DOMAIN)
          await this.setupMailgunWebhook(
            process.env.MAILGUN_API_KEY,
            process.env.MAILGUN_TEST_DOMAIN
          );
      } catch (e) {
        this.error(e, WebhooksService.name, session);
      }
    })();
  }

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: WebhooksService.name,
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
        class: WebhooksService.name,
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
        class: WebhooksService.name,
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
        class: WebhooksService.name,
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
        class: WebhooksService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  public async processSendgridData(
    signature: string,
    timestamp: string,
    session: string,
    data?: any[]
  ) {
    let step: Step = null;

    for (const item of data) {
      if (!item.stepId) continue;

      step = await this.stepRepository.findOne({
        where: {
          id: item.stepId,
        },
        relations: ['workspace'],
      });

      if (step) break;
    }

    if (!step) return;
    const { sendgridVerificationKey } = step.workspace;

    if (!sendgridVerificationKey)
      throw new BadRequestException(
        'No sendgridVerificationKey was found to check signature'
      );

    const payload =
      data.length > 1
        ? JSON.stringify(data).split('},{').join('},\r\n{') + '\r\n'
        : JSON.stringify(data) + '\r\n';

    const ew = new EventWebhook();
    const key = ew.convertPublicKeyToECDSA(sendgridVerificationKey);
    const validSignature = ew.verifySignature(
      key,
      payload,
      signature,
      timestamp
    );

    if (!validSignature) throw new ForbiddenException('Invalid signature');

    const messagesToInsert: ClickHouseMessage[] = [];

    for (const item of data) {
      const {
        stepId,
        customerId,
        templateId,
        event,
        sg_message_id,
        timestamp,
      } = item;
      if (
        !stepId ||
        !customerId ||
        !templateId ||
        !event ||
        !sg_message_id ||
        !timestamp
      )
        continue;

      const clickHouseRecord: ClickHouseMessage = {
        workspaceId: step.workspace.id,
        stepId,
        customerId,
        templateId: String(templateId),
        messageId: sg_message_id.split('.')[0],
        event: this.sendgridEventsMap[event] || event,
        eventProvider: ClickHouseEventProvider.SENDGRID,
        processed: false,
        createdAt: new Date().toISOString(),
      };

      messagesToInsert.push(clickHouseRecord);
    }
    await this.insertMessageStatusToClickhouse(messagesToInsert, session);
  }

  public async processTwilioData(
    {
      stepId,
      customerId,
      templateId,
      SmsStatus,
      MessageSid,
    }: {
      stepId: string;
      customerId: string;
      templateId: string;
      SmsStatus: string;
      MessageSid: string;
    },
    session: string
  ) {
    const step = await this.stepRepository.findOne({
      where: {
        id: stepId,
      },
      relations: ['workspace'],
    });
    const clickHouseRecord: ClickHouseMessage = {
      workspaceId: step.workspace.id,
      stepId,
      customerId,
      templateId: String(templateId),
      messageId: MessageSid,
      event: SmsStatus,
      eventProvider: ClickHouseEventProvider.TWILIO,
      processed: false,
      createdAt: new Date().toISOString(),
    };
    await this.insertMessageStatusToClickhouse([clickHouseRecord], session);
  }

  public async processResendData(req: any, body: any, session: string) {
    const step = await this.stepRepository.findOne({
      where: {
        id: body.data.tags.stepId,
      },
      relations: ['workspace'],
    });

    const payload = req.rawBody.toString('utf8');
    const headers = req.headers;

    const webhook = new Webhook(step.workspace.resendSigningSecret);

    try {
      const event: any = webhook.verify(payload, headers);
      const clickHouseRecord: ClickHouseMessage = {
        workspaceId: step.workspace.id,
        stepId: event.data.tags.stepId,
        customerId: event.data.tags.customerId,
        templateId: String(event.data.tags.templateId),
        messageId: event.data.email_id,
        event: event.type.replace('email.', ''),
        eventProvider: ClickHouseEventProvider.RESEND,
        processed: false,
        createdAt: new Date().toISOString(),
      };
      await this.insertMessageStatusToClickhouse([clickHouseRecord], session);
    } catch (e) {
      throw new ForbiddenException(e, 'Invalid signature');
    }
  }

  public async processMailgunData(
    body: {
      signature: { token: string; timestamp: string; signature: string };
      'event-data': {
        event: string;
        message: { headers: { 'message-id': string } };
        'user-variables': {
          stepId: string;
          customerId: string;
          templateId: string;
          accountId: string;
        };
      };
    },
    session: string
  ) {
    const {
      timestamp: signatureTimestamp,
      token: signatureToken,
      signature,
    } = body.signature;

    const {
      event,
      message: {
        headers: { 'message-id': id },
      },
      'user-variables': { stepId, customerId, templateId, accountId },
    } = body['event-data'];

    const account = await this.accountRepository.findOne({
      where: { id: accountId },
      relations: ['teams.organization.workspaces'],
    });
    if (!account) throw new NotFoundException('Account not found');

    const value = signatureTimestamp + signatureToken;

    const hash = createHmac(
      'sha256',
      account?.teams?.[0]?.organization?.workspaces?.[0]?.mailgunAPIKey ||
        process.env.MAILGUN_API_KEY
    )
      .update(value)
      .digest('hex');

    if (hash !== signature) {
      throw new ForbiddenException('Invalid signature');
    }

    this.debug(
      `${JSON.stringify({ webhook: body })}`,
      this.processMailgunData.name,
      session
    );

    if (!stepId || !customerId || !templateId || !id) return;

    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];
    const clickHouseRecord: ClickHouseMessage = {
      workspaceId: workspace.id,
      stepId,
      customerId,
      templateId: String(templateId),
      messageId: id,
      event: event,
      eventProvider: ClickHouseEventProvider.MAILGUN,
      processed: false,
      createdAt: new Date().toISOString(),
    };

    this.debug(
      `${JSON.stringify({ clickhouseMessage: clickHouseRecord })}`,
      this.processMailgunData.name,
      session
    );

    await this.insertMessageStatusToClickhouse([clickHouseRecord], session);
  }

  public async setupMailgunWebhook(
    mailgunAPIKey: string,
    sendingDomain: string
  ) {
    const mailgun = new Mailgun(formData);
    const mg = mailgun.client({
      username: 'api',
      key: mailgunAPIKey,
    });
    try {
      let installedWebhooks = await mg.webhooks.list(sendingDomain, {});
      this.logger.log(JSON.stringify(installedWebhooks));

      for (const webhookToInstall of this.MAILGUN_HOOKS_TO_INSTALL) {
        //Webhook does not exist on domain
        if (!installedWebhooks?.[webhookToInstall]) {
          await mg.webhooks.create(
            sendingDomain,
            webhookToInstall,
            process.env.MAILGUN_WEBHOOK_ENDPOINT
          );
          installedWebhooks = await mg.webhooks.list(sendingDomain, {});
        }

        // Webhook exists on domain and is set to current endpoint
        if (
          installedWebhooks?.[webhookToInstall]?.urls &&
          installedWebhooks[webhookToInstall].urls.includes(
            process.env.MAILGUN_WEBHOOK_ENDPOINT
          )
        )
          continue;
        else {
          // Webhooks exist on domain but are not set to current endpoint:
          // truncate webhooks to two and add third
          const urls = new FormData();
          urls.append('url', process.env.MAILGUN_WEBHOOK_ENDPOINT);
          urls.append('url', installedWebhooks?.[webhookToInstall]?.urls[0]);
          if (installedWebhooks?.[webhookToInstall]?.urls?.length > 1)
            urls.append('url', installedWebhooks?.[webhookToInstall]?.urls[1]);

          const r = axios.create({});
          await r({
            method: 'put',
            url: `https://api.mailgun.net/v3/domains/${sendingDomain}/webhooks/${webhookToInstall}`,
            data: urls,
            headers: {
              'Content-Type': 'multipart/form-data',
            },
            auth: {
              username: 'api',
              password: mailgunAPIKey,
            },
          });
          installedWebhooks = await mg.webhooks.list(sendingDomain, {});
        }
      }
      return Promise.resolve();
    } catch (err) {
      this.error(err,this.setupMailgunWebhook.name,randomUUID());
      return Promise.reject(err);
    }
  }

  /**
   * Queue a ClickHouseMessage to kafka so that it will be ingested into clickhouse.
   */
  public async insertMessageStatusToClickhouse(
    clickhouseMessages: ClickHouseMessage[],
    session: string
  ) {
    await this.eventPreprocessorQueue.addBulk(
      clickhouseMessages.map((element) => {
        return {
          name: 'message',
          data: {
            workspaceId: element.workspaceId,
            message: element,
            session: session,
            customer: element.customerId,
          },
        };
      })
    );
    return await this.kafkaService.produceMessage(
      KAFKA_TOPIC_MESSAGE_STATUS,
      clickhouseMessages.map((clickhouseMessage) => ({
        value: JSON.stringify(clickhouseMessage),
      }))
    );
  }
}
