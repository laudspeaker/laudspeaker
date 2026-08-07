import { RawBodyRequest } from "@nestjs/common";
import { EmailCredentials, EmailProviderData, EmailSendingData, EmailSetupData, EmailCallbackData } from "../interfaces/email.data";

export interface MailkiteCredentials extends EmailCredentials {
  // MailKite API key (mk_live_…). A Bearer token — interchangeable with a session/OAuth token.
  apiKey: string;
  // Account webhook signing secret, used to verify the x-mailkite-signature header on
  // tracking-event callbacks. Surfaced in the MailKite dashboard.
  signingSecret: string;
}

export interface MailkiteProviderData extends EmailProviderData {
  domains: string[];
}

export interface MailkiteSendingData extends EmailSendingData {
  domain: string;
  to: string;
  from_name: string;
  subject: string;
  html: string;
  text?: string;
  local_part: string;
  cc?: string[];
  bcc?: string[];
  [key: string]: any;
}

export interface MailkiteSetupData extends EmailSetupData {
  domain: string;
}

export interface MailkiteCallbackData extends EmailCallbackData {
  request: RawBodyRequest<Request>;
}
