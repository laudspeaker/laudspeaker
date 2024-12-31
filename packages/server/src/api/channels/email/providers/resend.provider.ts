import { EmailProvider } from '../interfaces/email.provider';
import { EmailCallbackData, EmailCredentials, EmailProviderData, EmailSendingData, EmailSetupData } from '../interfaces/email.data';
import { ClickHouseMessage } from '../../../../common/services/clickhouse/interfaces/clickhouse-message';
import { ClickHouseEventProvider } from '../../../../common/services/clickhouse';
import { ForbiddenException, Injectable } from '@nestjs/common';
import { BaseLiquidEngineProvider } from '../../interfaces/base.provider';
import { CallbackData, Credentials, ProviderData, SendingData, SetupData } from '../../interfaces/data.interface';
import { Resend } from 'resend';
import _ from 'lodash';
import { ResendCallbackData, ResendCredentials, ResendSendingData } from '../types/resend.data';
import { Webhook } from 'svix';

@Injectable()
export class ResendProvider extends BaseLiquidEngineProvider implements EmailProvider {
  constructor() {
    super();
  }

  private isResendCredentials(credentials: EmailCredentials): credentials is ResendCredentials {
    return (
      (credentials as ResendCredentials).apiKey !== undefined &&
      (credentials as ResendCredentials).signingSecret !== undefined
    );
  }

  private isResendSendingData(data: EmailSendingData): data is ResendSendingData {
    return (
      (data as ResendSendingData).domain !== undefined &&
      (data as ResendSendingData).to !== undefined &&
      (data as ResendSendingData).from_name !== undefined &&
      (data as ResendSendingData).subject !== undefined &&
      (data as ResendSendingData).html !== undefined &&
      (data as ResendSendingData).local_part !== undefined
    );
  }

  private isResendCallbackData(data: EmailCallbackData): data is ResendCallbackData {
    return (data as ResendCallbackData).request !== undefined;
  }

  async fetch<T extends EmailCredentials, U extends EmailProviderData>(creds: Credentials<T>): Promise<ProviderData<U>> {
    const { credentials, metadata } = creds;

    if (this.isResendCredentials(credentials)) {
      const resend = new Resend(credentials.apiKey);
      const response: any = await resend.domains.list();
      const domains = response['data']['data'];
      const verified = _.filter(domains, ['status', 'verified']);
      return { data: { domains: verified } as unknown as U };
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
      eventProvider: ClickHouseEventProvider.RESEND,
      messageId: undefined,
      templateId: String(metadata.templateID),
      workspaceId: metadata.workspaceID,
      processed: false
    };

    if (this.isResendCredentials(credentials) && this.isResendSendingData(data)) {
      try {
        textWithInsertedTags = await this.parseLiquid(data.html, data.tags);
        subjectWithInsertedTags = await this.parseLiquid(data.subject, data.tags);
      } catch (err) {
        return [{
          ...record,
          event: 'error',
          messageId: (err as Error).stack,
        }];
      }
      try {
        const resend: Resend = new Resend(credentials.apiKey);
        const resendMessage = await resend.emails.send({
          from: `${data.from_name} <${data.local_part}@${data.domain}>`,
          to: data.to,
          cc: data.cc,
          bcc: data.bcc,
          subject: subjectWithInsertedTags,
          html: textWithInsertedTags,
          tags: [
            {
              name: 'stepId',
              value: metadata.stepID,
            },
            {
              name: 'customerId',
              value: metadata.customerID,
            },
            {
              name: 'templateId',
              value: String(metadata.templateID),
            },
            {
              name: 'workspaceId',
              value: metadata.workspaceID,
            },
          ],
        });
        return [{
          ...record,
          event: 'sent',
          messageId: resendMessage.data ? resendMessage.data.id : '',
        }]
      }
      catch (err) {
        return [{
          ...record,
          event: 'error',
          messageId: (err as Error).stack,
        }]
      }
    }
    throw new Error('Invalid credentials or sending data type for ResendProvider');
  }

  async setup<T extends EmailCredentials, U extends EmailSetupData>(creds: Credentials<T>, data: SetupData<U>): Promise<void> { }

  async handle<T extends EmailCredentials, U extends EmailCallbackData>(creds: Credentials<T>, callbackData: CallbackData<U>): Promise<ClickHouseMessage[]> {
    const { data, metadata } = callbackData;
    const { credentials } = creds;

    if (this.isResendCredentials(credentials) && this.isResendCallbackData(data)) {
      const payload = data.request.rawBody.toString('utf8');
      const headers = data.request.headers as any;

      const webhook = new Webhook(credentials.signingSecret);

      try {
        const event: any = webhook.verify(payload, headers);
        return [{
          workspaceId: event.data.tags.workspaceId,
          stepId: event.data.tags.stepId,
          customerId: event.data.tags.customerId,
          templateId: String(event.data.tags.templateId),
          messageId: event.data.email_id,
          event: event.type.replace('email.', ''),
          eventProvider: ClickHouseEventProvider.RESEND,
          processed: false,
          createdAt: new Date(),
        }];
      } catch (e) {
        throw new ForbiddenException(e, 'Invalid signature on callback event');
      }
    }
    throw new Error('Invalid credentials or callback data type for ResendProvider');
  }

  async remove<T extends EmailCredentials>(creds: Credentials<T>): Promise<void> { }
}
