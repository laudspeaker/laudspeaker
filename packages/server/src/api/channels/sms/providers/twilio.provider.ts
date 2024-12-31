import { SMSProvider } from '../interfaces/sms.provider';
import { SMSCallbackData, SMSCredentials, SMSProviderData, SMSSendingData, SMSSetupData } from '../interfaces/sms.data';
import { ClickHouseMessage } from '../../../../common/services/clickhouse/interfaces/clickhouse-message';
import { ClickHouseEventProvider } from '../../../../common/services/clickhouse';
import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { createHmac } from 'crypto';
import { BaseLiquidEngineProvider } from '../../interfaces/base.provider';
import twilio from 'twilio';
import { CallbackData, Credentials, ProviderData, SendingData, SetupData } from '../../interfaces/data.interface';
import { TwilioCallbackData, TwilioCredentials, TwilioSendingData } from '../types/twilio.data';
import { IncomingPhoneNumberInstance } from 'twilio/lib/rest/api/v2010/account/incomingPhoneNumber';
import { MessageInstance } from 'twilio/lib/rest/api/v2010/account/message';

@Injectable()
export class TwilioProvider extends BaseLiquidEngineProvider implements SMSProvider {
  private static readonly MAXIMUM_SMS_LENGTH = 1600;
  constructor() {
    super();
  }

  private isTwilioCredentials(credentials: SMSCredentials): credentials is TwilioCredentials {
    return (
      (credentials as TwilioCredentials).sid !== undefined &&
      (credentials as TwilioCredentials).token !== undefined
    );
  }

  private isTwilioSendingData(data: SMSSendingData): data is TwilioSendingData {
    return (
      (data as TwilioSendingData).number !== undefined &&
      (data as TwilioSendingData).text !== undefined &&
      (data as TwilioSendingData).subject !== undefined &&
      (data as TwilioSendingData).body !== undefined &&
      (data as TwilioSendingData).text !== undefined
    );
  }


  private isTwilioCallbackData(data: SMSCallbackData): data is TwilioCallbackData {
    return (
      (data as TwilioCallbackData).body !== undefined &&
      (data as TwilioCallbackData).body.SmsSid !== undefined &&
      (data as TwilioCallbackData).body.SmsStatus !== undefined &&
      (data as TwilioCallbackData).body.MessageStatus !== undefined &&
      (data as TwilioCallbackData).body.MessageSid !== undefined &&
      (data as TwilioCallbackData).body.AccountSid !== undefined &&
      (data as TwilioCallbackData).body.From !== undefined &&
      (data as TwilioCallbackData).body.To !== undefined &&
      (data as TwilioCallbackData).body.ApiVersion !== undefined
    );
  }

  async fetch<T extends SMSCredentials, U extends SMSProviderData>(creds: Credentials<T>): Promise<ProviderData<U>> {
    const { credentials, metadata } = creds;

    if (this.isTwilioCredentials(credentials)) {
      const twilioClient: twilio.Twilio = twilio(credentials.sid, credentials.token);

      const results: IncomingPhoneNumberInstance[] = await twilioClient.incomingPhoneNumbers.list({
        limit: 20,
      });

      return { data: { numbers: results } as unknown as U };
    }
    throw new Error('Invalid credentials type for TwilioProvider');
  }

  async send<T extends SMSCredentials, U extends SMSSendingData>(creds: Credentials<T>, sendingData: SendingData<U>): Promise<ClickHouseMessage[]> {
    const { data, metadata } = sendingData;
    const { credentials } = creds;
    let textWithInsertedTags: string;

    let record: ClickHouseMessage = {
      createdAt: new Date(),
      stepId: metadata.stepID,
      customerId: metadata.customerID,
      event: undefined,
      eventProvider: ClickHouseEventProvider.TWILIO,
      messageId: undefined,
      templateId: String(metadata.templateID),
      workspaceId: metadata.workspaceID,
      processed: false
    };

    if (this.isTwilioCredentials(credentials) && this.isTwilioSendingData(data)) {
      try {
        textWithInsertedTags = await this.parseLiquid(data.text, data.tags);
      } catch (err) {
        return [{
          ...record,
          event: 'error',
          messageId: (err as Error).stack,
        }];
      }

      try {
        const twilioClient: twilio.Twilio = twilio(credentials.sid, credentials.token);
        const message: MessageInstance = await twilioClient.messages.create({
          body: textWithInsertedTags?.slice(0, TwilioProvider.MAXIMUM_SMS_LENGTH),
          from: data.number.phoneNumber,
          to: data.to,
          statusCallback: `${process.env.TWILIO_WEBHOOK_ENDPOINT}?stepId=${metadata.stepID}&customerId=${metadata.customerID}&templateId=${metadata.templateID}&workspaceId=${metadata.workspaceID}`,
        });

        return [{
          ...record,
          event: 'sent',
          messageId: message.sid,
        }];
      } catch (err) {
        return [{
          ...record,
          event: 'error',
          messageId: (err as Error).stack,
        }];
      }
    }
    throw new Error('Invalid credentials or sending data type for TwilioProvider');
  }

  async setup<T extends SMSCredentials, U extends SMSSetupData>(creds: Credentials<T>, setupData: SetupData<U>): Promise<void> { }

  async handle<T extends SMSCredentials, U extends SMSCallbackData>(creds: Credentials<T>, callbackData: CallbackData<U>): Promise<ClickHouseMessage[]> {
    const { data, metadata } = callbackData;
    const { credentials } = creds;

    let record: ClickHouseMessage = {
      createdAt: new Date(),
      stepId: metadata.stepID,
      customerId: metadata.customerID,
      event: undefined,
      eventProvider: ClickHouseEventProvider.TWILIO,
      messageId: undefined,
      templateId: String(metadata.templateID),
      workspaceId: metadata.workspaceID,
      processed: false
    };

    if (this.isTwilioCredentials(credentials) && this.isTwilioCallbackData(data)) {
      return [{
        ...record,
        messageId: data.body.MessageSid,
        event: data.body.MessageStatus
      }]

    }
    throw new Error('Invalid credentials or callback data type for TwilioProvider');
  }

  async remove<T extends SMSCredentials>(creds: Credentials<T>): Promise<void> { }
}
