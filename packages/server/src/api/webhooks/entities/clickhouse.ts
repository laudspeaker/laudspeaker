/* eslint-disable prettier/prettier */
export enum ClickHouseEventProvider {
  MAILGUN = 'mailgun',
  SENDGRID = 'sendgrid',
  TWILIO = 'twilio',
  SLACK = 'slack',
  FIREBASE = 'firebase',
  WEBHOOKS = 'webhooks',
  TRACKER = 'tracker',
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

