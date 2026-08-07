import { IncomingPhoneNumberInstance } from "twilio/lib/rest/api/v2010/account/incomingPhoneNumber";
import { SMSCredentials, SMSProviderData, SMSSendingData, SMSSetupData, SMSCallbackData } from "../interfaces/sms.data";

export interface TwilioCredentials extends SMSCredentials {
  sid: string;
  token: string;
}

export interface TwilioProviderData extends SMSProviderData {
  numbers: IncomingPhoneNumberInstance[];
}

export interface TwilioSendingData extends SMSSendingData {
  number: IncomingPhoneNumberInstance;
  text: string;
  to: string;
  [key: string]: any;
}

export interface TwilioSetupData extends SMSSetupData { }

export interface TwilioCallbackData extends SMSCallbackData {
  body: {
    SmsSid: string;
    SmsStatus: string;
    MessageStatus: string;
    To: string;
    MessageSid: string;
    AccountSid: string;
    From: string;
    ApiVersion: string;
  },
}