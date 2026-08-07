import { RawBodyRequest } from "@nestjs/common";
import { EmailCredentials, EmailProviderData, EmailSendingData, EmailSetupData, EmailCallbackData } from "../interfaces/email.data";

export interface ResendCredentials extends EmailCredentials {
  apiKey: string;
  signingSecret: string;
}

export interface ResendProviderData extends EmailProviderData {
  domains: string[];
}

export interface ResendSendingData extends EmailSendingData {
  domain: string;
  to: string;
  from_name: string;
  subject: string;
  html: string;
  local_part: string;
  cc?: string[];
  bcc?: string[];
  [key: string]: any;
}

export interface ResendSetupData extends EmailSetupData {
  domain: string;
}

export interface ResendCallbackData extends EmailCallbackData {
  request: RawBodyRequest<Request>;
}