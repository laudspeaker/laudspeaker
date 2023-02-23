import {
  ForbiddenException,
  Inject,
  Injectable,
  LoggerService,
} from '@nestjs/common';
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

const createTableQuery = `
CREATE TABLE IF NOT EXISTS message_status
(audienceId UUID, customerId String, templateId String, messageId String, event String, eventProvider String, createdAt DateTime) 
ENGINE = ReplacingMergeTree
PRIMARY KEY (audienceId, customerId, templateId, messageId, event, eventProvider, createdAt)`;

export enum ClickHouseEventProvider {
  MAILGUN = 'mailgun',
  SENDGRID = 'sendgrid',
  TWILIO = 'twilio',
}

export interface ClickHouseMessage {
  audienceId: string;
  customerId: string;
  templateId: string;
  messageId: string;
  event: string;
  eventProvider: ClickHouseEventProvider;
  createdAt: string;
}

@Injectable()
export class WebhooksService {
  private MAILGUN_HOOKS_TO_INSTALL = ['clicked', 'delivered', 'opened'];

  private clickHouseClient = createClient({
    host: process.env.CLICKHOUSE_HOST
      ? process.env.CLICKHOUSE_HOST.includes('http')
        ? process.env.CLICKHOUSE_HOST
        : `http://${process.env.CLICKHOUSE_HOST}`
      : 'http://localhost:8123',
    username: process.env.CLICKHOUSE_USER ?? 'default',
    password: process.env.CLICKHOUSE_PASSWORD ?? '',
  });

  private createClickHouseTable = async () => {
    await this.clickHouseClient.query({ query: createTableQuery });
  };

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
    private readonly logger: LoggerService,
    @InjectRepository(Audience)
    private audienceRepository: Repository<Audience>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>
  ) {
    (async () => {
      try {
        await this.createClickHouseTable();
        await this.setupMailgunWebhook(
          process.env.MAILGUN_API_KEY,
          process.env.MAILGUN_TEST_DOMAIN
        );
      } catch (e) {
        console.error(e);
      }
    })();
  }

  public async processSendgridData(
    signature: string,
    timestamp: string,
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
        audienceId,
        customerId,
        templateId: String(templateId),
        messageId: sg_message_id.split('.')[0],
        event: this.sendgridEventsMap[event] || event,
        eventProvider: ClickHouseEventProvider.SENDGRID,
        createdAt: new Date().toUTCString(),
      };

      this.logger.debug('Sendgrid webhooK result:');
      console.dir(clickHouseRecord, { depth: null });

      messagesToInsert.push(clickHouseRecord);
    }
    await this.insertClickHouseMessages(messagesToInsert);
  }

  public async processTwilioData({
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
  }) {
    const clickHouseRecord: ClickHouseMessage = {
      audienceId,
      customerId,
      templateId: String(templateId),
      messageId: MessageSid,
      event: SmsStatus,
      eventProvider: ClickHouseEventProvider.TWILIO,
      createdAt: new Date().toUTCString(),
    };

    this.logger.debug('Twilio webhooK result:');
    console.dir(clickHouseRecord, { depth: null });

    await this.insertClickHouseMessages([clickHouseRecord]);
  }

  public async processMailgunData(body: {
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
  }) {
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
      audienceId,
      customerId,
      templateId: String(templateId),
      messageId: id,
      event: event,
      eventProvider: ClickHouseEventProvider.MAILGUN,
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

    let installedWebhooks = await mg.webhooks.list(sendingDomain, {});

    for (const webhookToInstall of this.MAILGUN_HOOKS_TO_INSTALL) {
      if (!installedWebhooks?.[webhookToInstall]) {
        await mg.webhooks.create(
          sendingDomain,
          webhookToInstall,
          process.env.MAILGUN_WEBHOOK_ENDPOINT
        );
        installedWebhooks = await mg.webhooks.list(sendingDomain, {});
      }

      if (
        installedWebhooks?.[webhookToInstall]?.urls &&
        installedWebhooks[webhookToInstall].urls.includes(
          process.env.MAILGUN_WEBHOOK_ENDPOINT
        )
      )
        continue;

      await mg.webhooks.update(
        sendingDomain,
        webhookToInstall,
        process.env.MAILGUN_WEBHOOK_ENDPOINT
      );
    }
  }
}
