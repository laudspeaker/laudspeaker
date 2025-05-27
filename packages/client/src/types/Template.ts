import { PushBuilderData } from "pages/PushBuilder/PushBuilderContent";
import { WebhookState } from "pages/WebhookBuilder/WebhookSettings";
import Account from "./Account";

export enum TemplateType {
  EMAIL = "email",
  SLACK = "slack",
  SMS = "sms",
  WEBHOOK = "webhook",
  IN_APP_MESSAGE = "in-app",
  PUSH = "push",
}

export default interface Template {
  id: number;
  name: string;
  owner: Account;
  text: string;
  style: string;
  subject: string;
  slackMessage: string;
  pushObject: PushBuilderData | null;
  type: TemplateType;
  smsText: string;
  webhookData: WebhookState;
  createdAt: string;
  updatedAt: string;
  customEvents: string[];
  customFields?: Record<string, unknown>;
}
