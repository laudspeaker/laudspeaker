import { AttributeType } from "pages/PeopleImport/PeopleImport";
import { ConnectedPushFirebasePlatforms } from "pages/PushSettings/PushSettings";
import PlanType from "./PlanType";
import { PushPlatform } from "pages/PushBuilder/PushBuilderContent";

export interface UserPK {
  _id: string;
  key: string;
  isArray: boolean;
  type: AttributeType;
  isPrimary: true;
}

export interface CommonWorkspaceConnection {
  id: string;
  name: string;
}

export interface MailgunSendingOption {
  id: string;
  sendingEmail: string;
  sendingName: string;
}

export interface WorkspaceMailgunConnection extends CommonWorkspaceConnection {
  apiKey: string;
  sendingDomain: string;
  sendingOptions: MailgunSendingOption[];
}

export interface SendgridSendingOption {
  id: string;
  sendingEmail: string;
}

export interface WorkspaceSendgridConnection extends CommonWorkspaceConnection {
  apiKey: string;
  sendingOptions: SendgridSendingOption[];
}

export interface ResendSendingOption {
  id: string;
  sendingEmail: string;
  sendingName: string;
}

export interface WorkspaceResendConnection extends CommonWorkspaceConnection {
  apiKey: string;
  signingSecret: string;
  sendingDomain: string;
  sendingOptions: ResendSendingOption[];
}

export type WorkspaceEmailConnection =
  | WorkspaceMailgunConnection
  | WorkspaceSendgridConnection
  | WorkspaceResendConnection;

export interface WorkspaceTwilioConnection extends CommonWorkspaceConnection {
  sid: string;
  token: string;
  from: string;
}

export type PushFirebasePlatforms = Record<
  PushPlatform,
  | {
      fileName: string;
      credentials: JSON;
      isTrackingDisabled: boolean;
    }
  | undefined
>;

export interface WorkspacePushConnection extends CommonWorkspaceConnection {
  pushPlatforms: PushFirebasePlatforms;
}

export type WorkspaceConnection =
  | WorkspaceEmailConnection
  | WorkspaceTwilioConnection
  | WorkspacePushConnection;

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
    slackTeamId: string[];
    posthogApiKey: string[];
    posthogProjectId: string[];
    posthogHostUrl: string[];
    posthogSmsKey: string[];
    posthogEmailKey: string[];
    testSendingEmail?: string;
    testSendingName?: string;
    freeEmailsCount: number;
    posthogSetupped: boolean;
    javascriptSnippetSetupped: boolean;
    posthogFirebaseDeviceTokenKey?: string[];
    pk?: UserPK;
    mailgunConnections: WorkspaceMailgunConnection[];
    sendgridConnections: WorkspaceSendgridConnection[];
    resendConnections: WorkspaceResendConnection[];
    twilioConnections: WorkspaceTwilioConnection[];
    pushConnections: WorkspacePushConnection[];
  };
}
