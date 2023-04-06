import {
  WebhookMethod,
  WebhookState,
} from "pages/WebhookBuilder/WebhookBuilder";
import Account from "./Account";

export enum TemplateType {
  EMAIL = "email",
  SLACK = "slack",
  SMS = "sms",
  FIREBASE = "firebase",
  WEBHOOK = "webhook",
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
}
