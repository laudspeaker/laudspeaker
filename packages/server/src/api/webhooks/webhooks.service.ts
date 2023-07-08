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

export enum ClickHouseEventProvider {
  MAILGUN = 'mailgun',
  SENDGRID = 'sendgrid',
  TWILIO = 'twilio',
  SLACK = 'slack',
  FIREBASE = 'firebase',
  WEBHOOKS = 'webhooks',
  MSEGAT = 'msegat',
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
  userId: string;
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

  private clickHouseClient = createClient({
    host: process.env.CLICKHOUSE_HOST
      ? process.env.CLICKHOUSE_HOST.includes('http')
        ? process.env.CLICKHOUSE_HOST
        : `http://${process.env.CLICKHOUSE_HOST}`
      : 'http://localhost:8123',
    username: process.env.CLICKHOUSE_USER ?? 'default',
    password: process.env.CLICKHOUSE_PASSWORD ?? '',
  });

  public insertClickHouseMessages = async (values: ClickHouseMessage[]) => {
    await this.clickHouseClient.insert<ClickHouseMessage>({
      table: 'message_status',
      values,
      format: 'JSONEachRow',
    });
  };

  private sendgridEventsMap = {
    click: 'clicked',
    open: 'opened',
  };

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @InjectRepository(Audience)
    private audienceRepository: Repository<Audience>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>
  ) {
    const session = randomUUID();
    (async () => {
      try {
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
    let audience: Audience = null;

    for (const item of data) {
      if (!item.audienceId) continue;

      audience = await this.audienceRepository.findOne({
        where: {
          id: item.audienceId,
        },
        relations: ['owner'],
      });

      if (audience) break;
    }

    if (!audience) return;
    const {
      owner: { sendgridVerificationKey },
    } = audience;

    if (!sendgridVerificationKey)
      throw new BadRequestException(
        'No sendgridVerificationKey was found to check signature'
      );

    const publicKey = PublicKey.fromPem(sendgridVerificationKey);

    const decodedSignature = Signature.fromBase64(signature);
    const timestampPayload = timestamp + JSON.stringify(data) + '\r\n';

    const validSignature = Ecdsa.verify(
      timestampPayload,
      decodedSignature,
      publicKey
    );
    if (!validSignature) throw new ForbiddenException('Invalid signature');

    const messagesToInsert: ClickHouseMessage[] = [];

    for (const item of data) {
      const {
        audienceId,
        customerId,
        templateId,
        event,
        sg_message_id,
        timestamp,
      } = item;
      if (
        !audienceId ||
        !customerId ||
        !templateId ||
        !event ||
        !sg_message_id ||
        !timestamp
      )
        continue;

      const clickHouseRecord: ClickHouseMessage = {
        userId: audience.owner.id,
        audienceId,
        customerId,
        templateId: String(templateId),
        messageId: sg_message_id.split('.')[0],
        event: this.sendgridEventsMap[event] || event,
        eventProvider: ClickHouseEventProvider.SENDGRID,
        processed: false,
        createdAt: new Date().toUTCString(),
      };

      this.logger.debug('Sendgrid webhook result:');
      console.dir(clickHouseRecord, { depth: null });

      messagesToInsert.push(clickHouseRecord);
    }
    await this.insertClickHouseMessages(messagesToInsert);
  }

  public async processTwilioData(
    {
      audienceId,
      customerId,
      templateId,
      SmsStatus,
      MessageSid,
    }: {
      audienceId: string;
      customerId: string;
      templateId: string;
      SmsStatus: string;
      MessageSid: string;
    },
    session: string
  ) {
    const audience = await this.audienceRepository.findOne({
      where: {
        id: audienceId,
      },
      relations: ['owner'],
    });
    const clickHouseRecord: ClickHouseMessage = {
      userId: audience.owner.id,
      audienceId,
      customerId,
      templateId: String(templateId),
      messageId: MessageSid,
      event: SmsStatus,
      eventProvider: ClickHouseEventProvider.TWILIO,
      processed: false,
      createdAt: new Date().toUTCString(),
    };
    await this.insertClickHouseMessages([clickHouseRecord]);
  }

  public async processMailgunData(
    body: {
      signature: { token: string; timestamp: string; signature: string };
      'event-data': {
        event: string;
        message: { headers: { 'message-id': string } };
        'user-variables': {
          audienceId: string;
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
      'user-variables': { audienceId, customerId, templateId, accountId },
    } = body['event-data'];

    const account = await this.accountRepository.findOneBy({ id: accountId });
    if (!account) throw new NotFoundException('Account not found');

    const value = signatureTimestamp + signatureToken;

    const hash = createHmac(
      'sha256',
      account.mailgunAPIKey || process.env.MAILGUN_API_KEY
    )
      .update(value)
      .digest('hex');

    if (hash !== signature) {
      throw new ForbiddenException('Invalid signature');
    }

    if (!audienceId || !customerId || !templateId || !id) return;

    const clickHouseRecord: ClickHouseMessage = {
      userId: account.id,
      audienceId,
      customerId,
      templateId: String(templateId),
      messageId: id,
      event: event,
      eventProvider: ClickHouseEventProvider.MAILGUN,
      processed: false,
      createdAt: new Date().toUTCString(),
    };

    this.logger.debug('Mailgun webhooK result:');
    console.dir(clickHouseRecord, { depth: null });

    await this.insertClickHouseMessages([clickHouseRecord]);
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
      this.logger.error(
        `webhooks.service.ts:WebhooksService.setupMailgunWebhook: Error: ${err}`
      );
      return Promise.reject(err);
    }
  }
}
