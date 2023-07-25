import { WebhookState } from "pages/WebhookBuilder/WebhookSettings";
import Account from "./Account";

export enum TemplateType {
  EMAIL = "email",
  SLACK = "slack",
  SMS = "sms",
  FIREBASE = "firebase",
  WEBHOOK = "webhook",
  MODAL = "modal",
  CUSTOM_MODAL = "custom-modal",
}

export default interface Template {
  id: number;
  name: string;
  owner: Account;
  text: string;
  style: string;
  subject: string;
  slackMessage: string;
  type: TemplateType;
  smsText: string;
  webhookData: WebhookState;
  createdAt: string;
  updatedAt: string;
  customEvents: string[];
  customFields?: Record<string, unknown>;
}
