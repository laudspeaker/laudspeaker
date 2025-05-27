import { Injectable, NotFoundException } from '@nestjs/common';
import { Account } from '../accounts/entities/accounts.entity';
import { MessageChannel } from './entities/message-channel.enum';
import { Workspaces } from './entities/workspaces.entity';
import { WorkspaceMailgunConnection } from './entities/workspace-mailgun-connection.entity';
import { WorkspaceSendgridConnection } from './entities/workspace-sendgrid-connection.entity';
import { WorkspaceResendConnection } from './entities/workspace-resend-connection.entity';
import { WorkspaceTwilioConnection } from './entities/workspace-twilio-connection.entity';
import { WorkspacePushConnection } from './entities/workspace-push-connection.entity';
import { CreateMailgunChannelDto } from './dto/mailgun/create-mailgun-channel.dto';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { MailgunSendingOption } from './entities/mailgun-sending-option.entity';
import { SendgridSendingOption } from './entities/sendgrid-sending-option.entity';
import { UpdateMailgunChannelDto } from './dto/mailgun/update-mailgun-channel.dto';
import { CreateSendgridChannelDto } from './dto/sendgrid/create-sendgrid-channel.dto';
import { UpdateSendgridChannelDto } from './dto/sendgrid/update-sendgrid-channel.dto';
import { WebhooksService } from '../webhooks/webhooks.service';
import { MailService } from '@sendgrid/mail';
import { Client } from '@sendgrid/client';
import { UpdateResendChannelDto } from './dto/resend/update-resend-channel.dto';
import { CreateResendChannelDto } from './dto/resend/create-resend-channel.dto';
import { ResendSendingOption } from './entities/resend-sending-option.entity';
import { MailgunReplyToOption } from './entities/mailgun-reply-to-option.entity';
import { SendgridReplyToOption } from './entities/sendgrid-reply-to-option.entity';
import { ResendReplyToOption } from './entities/resend-reply-to-option.entity';

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

export type WorkspaceConnections = Pick<Workspaces, WorkspaceConnectionsKeys>;

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
  private sgMailService = new MailService();
  private sgClient = new Client();

  constructor(
    private webhookService: WebhooksService,
    @InjectRepository(WorkspaceMailgunConnection)
    private workspaceMailgunConnectionRepository: Repository<WorkspaceMailgunConnection>,
    @InjectRepository(MailgunSendingOption)
    private mailgunSendingOptionRepository: Repository<MailgunSendingOption>,
    @InjectRepository(MailgunReplyToOption)
    private mailgunReplyToOptionRepository: Repository<MailgunReplyToOption>,
    @InjectRepository(WorkspaceSendgridConnection)
    private workspaceSendgridConnectionRepository: Repository<WorkspaceSendgridConnection>,
    @InjectRepository(SendgridSendingOption)
    private sendgridSendingOptionRepository: Repository<SendgridSendingOption>,
    @InjectRepository(SendgridReplyToOption)
    private sendgridReplyToOptionRepository: Repository<SendgridReplyToOption>,
    @InjectRepository(WorkspaceResendConnection)
    private workspaceResendConnectionRepository: Repository<WorkspaceResendConnection>,
    @InjectRepository(ResendSendingOption)
    private resendSendingOptionRepository: Repository<ResendSendingOption>,
    @InjectRepository(ResendReplyToOption)
    private resendReplyToOptionRepository: Repository<ResendReplyToOption>
  ) { }

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

  public async createMailgunChannel(
    account: Account,
    createMailgunChannelDto: CreateMailgunChannelDto
  ) {
    const workspace = account.teams[0].organization.workspaces[0];
    const { sendingOptions, replyToOptions, ...channelSettings } = createMailgunChannelDto;

    await this.webhookService.setupMailgunWebhook(
      channelSettings.apiKey,
      channelSettings.sendingDomain
    );

    const connection = await this.workspaceMailgunConnectionRepository.save({
      ...channelSettings,
      workspace: { id: workspace.id },
    });

    if (sendingOptions.length !== 0) {
      await this.mailgunSendingOptionRepository.save(
        sendingOptions.map((option) => ({
          ...option,
          mailgunConnection: { id: connection.id },
        }))
      );
    }

    if (replyToOptions.length !== 0) {
      await this.mailgunReplyToOptionRepository.save(
        replyToOptions.map((option) => ({
          ...option,
          mailgunConnection: { id: connection.id },
        }))
      );
    }
  }


  public async createResendChannel(account: Account, createResendChannelDto: CreateResendChannelDto) {
    const workspace = account.teams[0].organization.workspaces[0];
    const { sendingOptions, replyToOptions, ...channelSettings } = createResendChannelDto;

    const connection = await this.workspaceResendConnectionRepository.save({
      ...channelSettings,
      workspace: { id: workspace.id },
    });

    if (sendingOptions.length !== 0) {
      await this.resendSendingOptionRepository.save(
        sendingOptions.map((option) => ({
          ...option,
          resendConnection: { id: connection.id },
        }))
      );
    }

    if (replyToOptions.length !== 0) {
      await this.resendReplyToOptionRepository.save(
        replyToOptions.map((option) => ({
          ...option,
          resendConnection: { id: connection.id },
        }))
      );
    }
  }

  public async updateMailgunChannel(
    account: Account,
    id: string,
    updateMailgunChannelDto: UpdateMailgunChannelDto
  ) {
    const workspace = account.teams[0].organization.workspaces[0];

    const mailgunChannels = (await this.getSpecificChannels(
      account,
      MessageChannel.MAILGUN
    )) as WorkspaceMailgunConnection[];

    const { sendingOptions, replyToOptions, ...channelSettings } = updateMailgunChannelDto;

    const channel = mailgunChannels.find((channel) => channel.id === id);
    if (!channel) throw new NotFoundException('Channel not found');

    if (channelSettings.apiKey && channelSettings.sendingDomain) {
      await this.webhookService.setupMailgunWebhook(
        channelSettings.apiKey,
        channelSettings.sendingDomain
      );
    }

    await this.workspaceMailgunConnectionRepository.save({
      ...channel,
      ...channelSettings,
      id,
      workspace: { id: workspace.id },
    });

    if (sendingOptions) {
      await this.mailgunSendingOptionRepository.delete({
        mailgunConnection: { id: channel.id },
      });
      if (sendingOptions.length !== 0)
        await this.mailgunSendingOptionRepository.save(
          sendingOptions.map((option) => ({
            ...option,
            mailgunConnection: { id: channel.id },
          }))
        );
    }

    if (replyToOptions) {
      await this.mailgunReplyToOptionRepository.delete({
        mailgunConnection: { id: channel.id },
      });
      if (replyToOptions.length !== 0)
        await this.mailgunReplyToOptionRepository.save(
          replyToOptions.map((option) => ({
            ...option,
            mailgunConnection: { id: channel.id },
          }))
        );
    }
  }

  public async updateResendChannel(account: Account, id: string, updateResendChannelDto: UpdateResendChannelDto) {
    const workspace = account.teams[0].organization.workspaces[0];

    const resendChannels = (await this.getSpecificChannels(
      account,
      MessageChannel.RESEND
    )) as WorkspaceResendConnection[];

    const { sendingOptions,replyToOptions, ...channelSettings } = updateResendChannelDto;

    const channel = resendChannels.find((channel) => channel.id === id);
    if (!channel) throw new NotFoundException('Channel not found');

    await this.workspaceResendConnectionRepository.save({
      ...channel,
      ...channelSettings,
      id,
      workspace: { id: workspace.id },
    });

    if (sendingOptions) {
      await this.resendSendingOptionRepository.delete({
        resendConnection: { id: channel.id },
      });
      if (sendingOptions.length !== 0)
        await this.resendSendingOptionRepository.save(
          sendingOptions.map((option) => ({
            ...option,
            resendConnection: { id: channel.id },
          }))
        );
    }

    if (replyToOptions) {
      await this.resendReplyToOptionRepository.delete({
        resendConnection: { id: channel.id },
      });
      if (replyToOptions.length !== 0)
        await this.resendReplyToOptionRepository.save(
          replyToOptions.map((option) => ({
            ...option,
            resendConnection: { id: channel.id },
          }))
        );
    }
  }

  public async createSendgridChannel(
    account: Account,
    createSendgridChannelDto: CreateSendgridChannelDto
  ) {
    const workspace = account.teams[0].organization.workspaces[0];
    const { sendingOptions, replyToOptions, ...channelSettings } = createSendgridChannelDto;

    this.sgClient.setApiKey(channelSettings.apiKey);
    let res = await this.sgClient.request({
      url: '/v3/user/webhooks/event/settings',
      method: 'PATCH',
      body: {
        enabled: true,
        url: process.env.SENDGRID_WEBHOOK_ENDPOINT,
        group_resubscribe: true,
        delivered: true,
        group_unsubscribe: true,
        spam_report: true,
        bounce: true,
        deferred: true,
        unsubscribe: true,
        processed: true,
        open: true,
        click: true,
        dropped: true,
      },
    });
    const [_, body] = await this.sgClient.request({
      url: `/v3/user/webhooks/event/settings/signed`,
      method: 'PATCH',
      body: {
        enabled: true,
      },
    });
    const verificationKey = body.public_key;

    const connection = await this.workspaceSendgridConnectionRepository.save({
      ...channelSettings,
      workspace: { id: workspace.id },
      verificationKey,
    });

    if (sendingOptions.length === 0) return;

    for (const option of sendingOptions) {
      this.sgMailService.setApiKey(channelSettings.apiKey);
      try {
        await this.sgMailService.send({
          subject: 'Sendgrid connection to Laudspeaker',
          from: option.sendingEmail,
          to: account.email,
          html: '<h1>If you see this message, you successfully connected your sendgrid email to laudspeaker</h1>',
        });
      } catch (error: any) {
        if (error.response) {
          console.error('Error status code:', error.response.statusCode);
          console.error('Error response body:', error.response.body);
        } else {
          console.error('Error:', error);
        }
      }
    }

    if (sendingOptions.length !== 0) {
      await this.sendgridSendingOptionRepository.save(
        sendingOptions.map((option) => ({
          ...option,
          sendgridConnection: { id: connection.id },
        }))
      );
    }

    if (replyToOptions.length !== 0) {
      await this.sendgridReplyToOptionRepository.save(
        replyToOptions.map((option) => ({
          ...option,
          sendgridConnection: { id: connection.id },
        }))
      );
    }
  }

  public async updateSendgridChannel(
    account: Account,
    id: string,
    updateSendgridChannelDto: UpdateSendgridChannelDto
  ) {
    const workspace = account.teams[0].organization.workspaces[0];

    const sendgridChannels = (await this.getSpecificChannels(
      account,
      MessageChannel.SENDGRID
    )) as WorkspaceSendgridConnection[];

    const { sendingOptions, replyToOptions, ...channelSettings } = updateSendgridChannelDto;

    const channel = sendgridChannels.find((channel) => channel.id === id);
    if (!channel) throw new NotFoundException('Channel not found');

    await this.workspaceSendgridConnectionRepository.save({
      ...channel,
      ...channelSettings,
      id,
      workspace: { id: workspace.id },
    });

    if (sendingOptions) {
      await this.sendgridSendingOptionRepository.delete({
        sendgridConnection: { id: channel.id },
      });
      if (sendingOptions.length !== 0)
        await this.sendgridSendingOptionRepository.save(
          sendingOptions.map((option) => ({
            ...option,
            sendgridConnection: { id: channel.id },
          }))
        );
    }

    if (replyToOptions) {
      await this.sendgridReplyToOptionRepository.delete({
        sendgridConnection: { id: channel.id },
      });
      if (replyToOptions.length !== 0)
        await this.sendgridReplyToOptionRepository.save(
          replyToOptions.map((option) => ({
            ...option,
            sendgridConnection: { id: channel.id },
          }))
        );
    }
  }
}
