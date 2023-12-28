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
  firstName: string | null;
  lastName: string | null;
  accountCreatedAt: Date | null;
  expectedOnboarding: string[];
  currentOnboarding: string[];
  onboarded: boolean;
  customerId?: string;
  verified: boolean;
  lastLoginAt: Date | null;
  secondtillunblockresend: string | null;
  workspace: {
    apiKey: string;
    plan: PlanType;
    messagesSent: number;
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
    posthogFirebaseDeviceTokenKey?: string[];
    pushPlatforms: ConnectedPushFirebasePlatforms;
    pk?: UserPK;
  };
}
