import { EmailProvider } from '../interfaces/email.provider';
import { EmailCallbackData, EmailCredentials, EmailProviderData, EmailSendingData, EmailSetupData } from '../interfaces/email.data';
import Mailgun from 'mailgun.js';
import formData from 'form-data';
import FormData from 'form-data';
import { ClickHouseMessage } from '../../../../common/services/clickhouse/interfaces/clickhouse-message';
import { ClickHouseEventProvider } from '../../../../common/services/clickhouse';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { createHmac } from 'crypto';
import { BaseLiquidEngineProvider } from '../../interfaces/base.provider';
import _ from 'lodash';
import Client from 'mailgun.js/client';
import { MessagesSendResult } from 'mailgun.js/interfaces/Messages';
import { MailgunCredentials, MailgunProviderData, MailgunSendingData, MailgunSetupData, MailgunCallbackData } from '../types/mailgun.data';
import { CallbackData, Credentials, ProviderData, SendingData, SetupData } from '../../interfaces/data.interface';

@Injectable()
export class MailgunProvider extends BaseLiquidEngineProvider implements EmailProvider {
  private static readonly MAILGUN_API_USERNAME = `api`;
  private static readonly MAILGUN_API_BASE_URL = `https://api.mailgun.net/v3`;
  private static readonly MAILGUN_HOOKS_TO_INSTALL = [
    'clicked',
    'complained',
    'delivered',
    'opened',
    'permanent_fail',
    'temporary_fail',
    'unsubscribed',
  ];
  private static readonly MAILGUN_DOMAINS_TO_FETCH = [`state`, `active`];

  constructor() {
    super();
  }

  private isMailgunCredentials(credentials: EmailCredentials): credentials is MailgunCredentials {
    return (credentials as MailgunCredentials).apiKey !== undefined;
  }

  private isMailgunProviderData(data: EmailProviderData): data is MailgunProviderData {
    return (data as MailgunProviderData).domains !== undefined;
  }

  private isMailgunSendingData(data: EmailSendingData): data is MailgunSendingData {
    return (
      (data as MailgunSendingData).domain !== undefined &&
      (data as MailgunSendingData).to !== undefined &&
      (data as MailgunSendingData).from !== undefined &&
      (data as MailgunSendingData).subject !== undefined &&
      (data as MailgunSendingData).body !== undefined
    );
  }


  private isMailgunSetupData(data: EmailSetupData): data is MailgunSetupData {
    return (data as MailgunSetupData).domain !== undefined;
  }


  private isMailgunCallbackData(data: EmailCallbackData): data is MailgunCallbackData {
    return true;
  }


  async fetch<T extends EmailCredentials, U extends EmailProviderData>(creds: Credentials<T>): Promise<ProviderData<U>> {
    const { credentials, metadata } = creds;

    if (this.isMailgunCredentials(credentials)) {
      const mailgun = new Mailgun(FormData);
      const mg = mailgun.client({ username: MailgunProvider.MAILGUN_API_USERNAME, key: credentials.apiKey });

      const domains = _.filter(await mg.domains.list(), MailgunProvider.MAILGUN_DOMAINS_TO_FETCH);

      return { data: { domains } as unknown as U };
    }
    throw new Error('Invalid credentials type for MailgunProvider');
  }

  async send<T extends EmailCredentials, U extends EmailSendingData>(creds: Credentials<T>, sendingData: SendingData<U>): Promise<ClickHouseMessage[]> {
    const { data, metadata } = sendingData;
    const { credentials } = creds;
    let textWithInsertedTags: string, subjectWithInsertedTags: string;

    let record: ClickHouseMessage = {
      createdAt: new Date(),
      stepId: metadata.stepID,
      customerId: metadata.customerID,
      event: undefined,
      eventProvider: ClickHouseEventProvider.MAILGUN,
      messageId: undefined,
      templateId: String(metadata.templateID),
      workspaceId: metadata.workspaceID,
      processed: false
    };

    if (this.isMailgunCredentials(credentials) && this.isMailgunSendingData(data)) {
      try {
        textWithInsertedTags = await this.parseLiquid(data.body, data.tags);
        subjectWithInsertedTags = await this.parseLiquid(data.subject, data.tags);
      } catch (err) {
        return [{
          ...record,
          event: 'error',
          messageId: (err as Error).stack,
        }];
      }

      try {
        const mailgun: Mailgun = new Mailgun(formData);
        const mg: Client = mailgun.client({ username: MailgunProvider.MAILGUN_API_USERNAME, key: credentials.apiKey });

        const result: MessagesSendResult = await mg.messages.create(data.domain.name, {
          from: `${data.from} <${data.from}>`,
          to: data.to,
          cc: data.cc,
          subject: subjectWithInsertedTags,
          html: textWithInsertedTags,
          'v:stepId': metadata.stepID,
          'v:customerId': metadata.customerID,
          'v:templateId': metadata.templateID,
          'v:workspaceId': metadata.workspaceID,
        });

        return [{
          ...record,
          event: 'sent',
          messageId: result.id ? result.id.replace('<', '').replace('>', '') : '',
        }];
      } catch (err) {
        return [{
          ...record,
          event: 'error',
          messageId: (err as Error).stack,
        }];
      }
    } else {
      throw new Error('Invalid credentials or sending data type for MailgunProvider');
    }
  }

  async setup<T extends EmailCredentials, U extends EmailSetupData>(creds: Credentials<T>, setupData: SetupData<U>): Promise<void> {
    const { data, metadata } = setupData;
    const { credentials } = creds;

    if (this.isMailgunCredentials(credentials) && this.isMailgunSetupData(data)) {
      const base64ApiKey: string = Buffer.from(`${MailgunProvider.MAILGUN_API_USERNAME}:${credentials.apiKey}`).toString('base64');
      const headers = {
        Authorization: `Basic ${base64ApiKey}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      };

      const updateWebhook = async (type: string) => {
        const url = `${MailgunProvider.MAILGUN_API_BASE_URL}/domains/${data.domain}/webhooks/${type}`;
        try {
          const response = await fetch(url, {
            method: 'PUT',
            headers: headers,
            body: new URLSearchParams({
              url: process.env.MAILGUN_WEBHOOK_ENDPOINT,
            }),
          });

          const responseData = await response.json();
          return { status: response.status, body: responseData };
        } catch (error) {
          return { error };
        }
      };

      const updateAllWebhooks = async () => {
        const updatePromises = MailgunProvider.MAILGUN_HOOKS_TO_INSTALL.map((type) =>
          updateWebhook(type)
        );

        const results = await Promise.allSettled(updatePromises);

        results.forEach((result, index) => {
          if (result.status === 'fulfilled' && result.value.status === 200) {
            this.log(
              `Webhook ${MailgunProvider.MAILGUN_HOOKS_TO_INSTALL[index]} updated successfully`,
              this.setup.name,
              ''
            );
          } else {
            this.log(
              `Failed to update webhook ${MailgunProvider.MAILGUN_HOOKS_TO_INSTALL[index]
              }: ${JSON.stringify(result)}`, this.setup.name, ''
            );
          }
        });
      };

      await updateAllWebhooks();
    } else {
      throw new Error('Invalid credentials or setup data type for MailgunProvider');
    }
  }

  async handle<T extends EmailCredentials, U extends EmailCallbackData>(creds: Credentials<T>, callbackData: CallbackData<U>): Promise<ClickHouseMessage[]> {
    const { data, metadata } = callbackData;
    const { credentials } = creds;

    if (this.isMailgunCredentials(credentials) && this.isMailgunCallbackData(data)) {
      const {
        timestamp: signatureTimestamp,
        token: signatureToken,
        signature,
      } = data.body.signature;

      const {
        event,
        message: {
          headers: { 'message-id': id },
        },
        'user-variables': { stepId, customerId, templateId, workspaceId },
      } = data.body['event-data'];

      const value = signatureTimestamp + signatureToken;


      const hash = createHmac(
        'sha256',
        credentials.apiKey
      )
        .update(value)
        .digest('hex');

      if (hash !== signature) {
        throw new ForbiddenException('Invalid signature');
      }

      if (!stepId || !customerId || !templateId || !workspaceId || !id) return;

      const clickHouseRecord: ClickHouseMessage = {
        workspaceId,
        stepId,
        customerId,
        templateId: String(templateId),
        messageId: id,
        event: event,
        eventProvider: ClickHouseEventProvider.MAILGUN,
        processed: false,
        createdAt: new Date(),
      };

      return [clickHouseRecord];
    }
    throw new Error('Invalid credentials or callback data type for MailgunProvider');

  }

  async remove<MailgunCredentials>(credentials: Credentials<MailgunCredentials>): Promise<void> { }

}
