import { Domain } from "mailgun.js/domains";
import { EmailCredentials, EmailProviderData, EmailSendingData, EmailSetupData, EmailCallbackData } from "../interfaces/email.data";

export interface MailgunCredentials extends EmailCredentials {
  apiKey: string;
}

export interface MailgunProviderData extends EmailProviderData {
  domains: Domain[];
}

export interface MailgunSendingData extends EmailSendingData {
  domain: Domain;
  to: string;
  from: string;
  subject: string;
  body: string;
  cc?: string[];
  bcc?: string[];
  [key: string]: any;
}

export interface MailgunSetupData extends EmailSetupData {
  domain: Domain;
}

export interface MailgunCallbackData extends EmailCallbackData {
  body: {
    signature: {
      token: string;
      timestamp: string;
      signature: string
    };
    'event-data': {
      event: string;
      message: {
        headers: {
          'message-id': string
        }
      };
      'user-variables': {
        stepId: string;
        customerId: string;
        templateId: string;
        workspaceId: string;
      };
    };
  },
}