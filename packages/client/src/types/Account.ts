import { AttributeType } from "pages/PeopleImport/PeopleImport";
import { ConnectedPushFirebasePlatforms } from "pages/PushSettings/PushSettings";
import PlanType from "./PlanType";

export interface UserPK {
  _id: string;
  key: string;
  isArray: boolean;
  type: AttributeType;
  isPrimary: true;
}

export default interface Account {
  id: string;
  email: string;
  apiKey: string;
  firstName: string | null;
  lastName: string | null;
  accountCreatedAt: Date | null;
  lastLoginAt: Date | null;
  messagesSent: number;
  plan: PlanType;
  verified: boolean;
  mailgunAPIKey: string;
  sendingDomain: string;
  sendingEmail: string;
  sendingName: string;
  slackTeamId: string[];
  posthogApiKey: string[];
  posthogProjectId: string[];
  posthogHostUrl: string[];
  posthogSmsKey: string[];
  posthogEmailKey: string[];
  expectedOnboarding: string[];
  currentOnboarding: string[];
  onboarded: boolean;
  customerId?: string;
  emailProvider?: string;
  testSendingEmail?: string;
  testSendingName?: string;
  freeEmailsCount: number;
  sendgridApiKey?: string;
  sendgridFromEmail?: string;
  sendgridVerificationKey?: string;
  smsAccountSid?: string;
  smsAuthToken?: string;
  smsFrom?: string;
  posthogSetupped: boolean;
  javascriptSnippetSetupped: boolean;
  pushPlatforms: ConnectedPushFirebasePlatforms;
  pk?: UserPK;
}
