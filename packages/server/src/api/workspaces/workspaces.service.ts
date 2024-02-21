import { Injectable } from '@nestjs/common';
import { Account } from '../accounts/entities/accounts.entity';
import { MessageChannel } from './entities/message-channel.enum';
import { Workspace } from './entities/workspace.entity';
import { WorkspaceMailgunConnection } from './entities/workspace-mailgun-connection.entity';
import { WorkspaceSendgridConnection } from './entities/workspace-sendgrid-connection.entity';
import { WorkspaceResendConnection } from './entities/workspace-resend-connection.entity';
import { WorkspaceTwilioConnection } from './entities/workspace-twilio-connection.entity';
import { WorkspacePushConnection } from './entities/workspace-push-connection.entity';

export type WorkspaceConnection =
  | WorkspaceMailgunConnection
  | WorkspaceSendgridConnection
  | WorkspaceResendConnection
  | WorkspaceTwilioConnection
  | WorkspacePushConnection;

export type WorkspaceConnectionsKeys =
  | 'mailgunConnections'
  | 'sendgridConnections'
  | 'resendConnections'
  | 'twilioConnections'
  | 'pushConnections';

export type WorkspaceConnections = Pick<Workspace, WorkspaceConnectionsKeys>;

const messageChannelToKeyMap: Record<MessageChannel, WorkspaceConnectionsKeys> =
  {
    [MessageChannel.MAILGUN]: 'mailgunConnections',
    [MessageChannel.SENDGRID]: 'sendgridConnections',
    [MessageChannel.RESEND]: 'resendConnections',
    [MessageChannel.TWILIO]: 'twilioConnections',
    [MessageChannel.PUSH]: 'pushConnections',
  };

@Injectable()
export class WorkspacesService {
  public async getChannels(account: Account): Promise<WorkspaceConnections> {
    const workspace = account.teams[0].organization.workspaces[0];

    const {
      mailgunConnections,
      sendgridConnections,
      resendConnections,
      twilioConnections,
      pushConnections,
    } = workspace;

    return {
      mailgunConnections,
      sendgridConnections,
      resendConnections,
      twilioConnections,
      pushConnections,
    };
  }

  public async getSpecificChannels<T extends MessageChannel>(
    account: Account,
    channel: T
  ) {
    const channels = await this.getChannels(account);

    return channels[messageChannelToKeyMap[channel]];
  }

  public async getSpecificChannel(
    account: Account,
    channel: MessageChannel,
    id: string
  ) {
    const channels = (await this.getSpecificChannels(account, channel)) as {
      id: string;
    }[];

    return channels.find((chan) => chan.id === id);
  }
}
