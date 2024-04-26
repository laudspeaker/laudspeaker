import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Workspace } from './entities/workspace.entity';
import { Repository } from 'typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { AccountsService } from '../accounts/accounts.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { OrganizationService } from '../organizations/organizations.service';
import { UpdateWorkspaceDto } from './dto/update-workspace.dto';

import { MessageChannel } from './entities/message-channel.enum';
import { WorkspaceMailgunConnection } from './entities/workspace-mailgun-connection.entity';
import { WorkspaceSendgridConnection } from './entities/workspace-sendgrid-connection.entity';
import { WorkspaceResendConnection } from './entities/workspace-resend-connection.entity';
import { WorkspaceTwilioConnection } from './entities/workspace-twilio-connection.entity';
import { WorkspacePushConnection } from './entities/workspace-push-connection.entity';
import { CreateMailgunChannelDto } from './dto/mailgun/create-mailgun-channel.dto';
import { MailgunSendingOption } from './entities/mailgun-sending-option.entity';
import { SendgridSendingOption } from './entities/sendgrid-sending-option.entity';
import { UpdateMailgunChannelDto } from './dto/mailgun/update-mailgun-channel.dto';
import { CreateSendgridChannelDto } from './dto/sendgrid/create-sendgrid-channel.dto';
import { UpdateSendgridChannelDto } from './dto/sendgrid/update-sendgrid-channel.dto';
import { WebhooksService } from '../webhooks/webhooks.service';
import { MailService } from '@sendgrid/mail';
import { Client } from '@sendgrid/client';
import { CreateTwilioChannelDto } from './dto/twilio/create-twilio-channel.dto';
import { UpdateTwilioChannelDto } from './dto/twilio/update-twilio-channel.dto';
import { CreatePushChannelDto } from './dto/push/create-push-channel.dto';
import { UpdatePushChannelDto } from './dto/push/update-push-channel.dto';
import { CreateResendChannelDto } from './dto/resend/create-resend-channel.dto';
import { UpdateResendChannelDto } from './dto/resend/update-resend-channel.dto';
import { ResendSendingOption } from './entities/resend-sending-option.entity';

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
  private sgMailService = new MailService();
  private sgClient = new Client();

  constructor(
    private accountsService: AccountsService,
    private organizationService: OrganizationService,
    @InjectRepository(Workspace)
    public workspacesRepository: Repository<Workspace>,
    private webhookService: WebhooksService,
    @InjectRepository(WorkspaceMailgunConnection)
    private workspaceMailgunConnectionRepository: Repository<WorkspaceMailgunConnection>,
    @InjectRepository(MailgunSendingOption)
    private mailgunSendingOptionRepository: Repository<MailgunSendingOption>,
    @InjectRepository(WorkspaceSendgridConnection)
    private workspaceSendgridConnectionRepository: Repository<WorkspaceSendgridConnection>,
    @InjectRepository(SendgridSendingOption)
    private sendgridSendingOptionRepository: Repository<SendgridSendingOption>,
    @InjectRepository(WorkspaceResendConnection)
    private workspaceResendConnectionRepository: Repository<WorkspaceResendConnection>,
    @InjectRepository(ResendSendingOption)
    private resendSendingOptionRepository: Repository<ResendSendingOption>,
    @InjectRepository(WorkspaceTwilioConnection)
    private workspaceTwilioConnectionRepository: Repository<WorkspaceTwilioConnection>,
    @InjectRepository(WorkspacePushConnection)
    private workspacePushConnectionRepository: Repository<WorkspacePushConnection>
  ) {}

  public async getAllWorkspaces(account: Account) {
    account = await this.accountsService.accountsRepository.findOne({
      where: { id: account.id },
      relations: ['teams.organization.workspaces'],
    });

    return account.teams[0].organization.workspaces;
  }

  public async findOneByAPIKey(apiKey: string) {
    const workspace = await this.workspacesRepository.findOneBy({ apiKey });
    if (!workspace) throw new NotFoundException('Workspace not found');

    return workspace;
  }

  public async updateCurrentWorkspace(
    account: Account,
    updateWorkspaceDto: UpdateWorkspaceDto
  ) {
    if (!account.currentWorkspace)
      throw new NotFoundException('Workspace not found');

    await this.workspacesRepository.save({
      id: account.currentWorkspace.id,
      ...updateWorkspaceDto,
    });
  }

  public getCurrentWorkspace(account: Account) {
    return account.currentWorkspace;
  }

  public async setCurrentWorkspace(account: Account, id: string) {
    const workspaces = await this.getAllWorkspaces(account);

    const newCurrentWorkspace = workspaces.find(
      (workspace) => workspace.id === id
    );

    if (!newCurrentWorkspace)
      throw new NotFoundException('Workspace not found');

    await this.accountsService.accountsRepository.save({
      id: account.id,
      currentWorkspace: { id: newCurrentWorkspace.id },
    });
  }

  public async createWorkspace(
    account: Account,
    createWorkspaceDto: CreateWorkspaceDto
  ) {
    await this.workspacesRepository.save({
      name: createWorkspaceDto.name,
      organization: { id: account.teams[0].organization.id },
      apiKey: this.organizationService.authHelper.generateApiKey(),
    });
  }

  public async getChannels(account: Account): Promise<WorkspaceConnections> {
    const workspace = account.currentWorkspace;

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
    const workspace = account.currentWorkspace;
    const { sendingOptions, ...channelSettings } = createMailgunChannelDto;

    await this.webhookService.setupMailgunWebhook(
      channelSettings.apiKey,
      channelSettings.sendingDomain
    );

    const connection = await this.workspaceMailgunConnectionRepository.save({
      ...channelSettings,
      workspace: { id: workspace.id },
    });

    if (sendingOptions.length === 0) return;

    await this.mailgunSendingOptionRepository.save(
      sendingOptions.map((option) => ({
        ...option,
        mailgunConnection: { id: connection.id },
      }))
    );
  }

  public async updateMailgunChannel(
    account: Account,
    id: string,
    updateMailgunChannelDto: UpdateMailgunChannelDto
  ) {
    const workspace = account.currentWorkspace;

    const mailgunChannels = (await this.getSpecificChannels(
      account,
      MessageChannel.MAILGUN
    )) as WorkspaceMailgunConnection[];

    const { sendingOptions, ...channelSettings } = updateMailgunChannelDto;

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

    if (!sendingOptions) return;

    await this.mailgunSendingOptionRepository.delete({
      mailgunConnection: { id: channel.id },
    });

    if (sendingOptions.length === 0) return;

    await this.mailgunSendingOptionRepository.save(
      sendingOptions.map((option) => ({
        ...option,
        mailgunConnection: { id: channel.id },
      }))
    );
  }

  public async createSendgridChannel(
    account: Account,
    createSendgridChannelDto: CreateSendgridChannelDto
  ) {
    const workspace = account.currentWorkspace;
    const { sendingOptions, ...channelSettings } = createSendgridChannelDto;

    this.sgClient.setApiKey(channelSettings.apiKey);
    await this.sgClient.request({
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
    const body = (
      await this.sgClient.request({
        url: `/v3/user/webhooks/event/settings/signed`,
        method: 'PATCH',
        body: {
          enabled: true,
        },
      })
    )[1];
    const verificationKey = body.public_key;

    const connection = await this.workspaceSendgridConnectionRepository.save({
      ...channelSettings,
      workspace: { id: workspace.id },
      verificationKey,
    });

    if (sendingOptions.length === 0) return;

    for (const option of sendingOptions) {
      this.sgMailService.setApiKey(channelSettings.apiKey);
      await this.sgMailService.send({
        subject: 'Sendgrid connection to Laudspeaker',
        from: option.sendingEmail,
        to: account.email,
        html: '<h1>If you see this message, you successfully connected your sendgrid email to laudspeaker</h1>',
      });
    }

    await this.sendgridSendingOptionRepository.save(
      sendingOptions.map((option) => ({
        ...option,
        sendgridConnection: { id: connection.id },
      }))
    );
  }

  public async updateSendgridChannel(
    account: Account,
    id: string,
    updateSendgridChannelDto: UpdateSendgridChannelDto
  ) {
    const workspace = account.currentWorkspace;

    const sendgridChannels = (await this.getSpecificChannels(
      account,
      MessageChannel.SENDGRID
    )) as WorkspaceSendgridConnection[];

    const { sendingOptions, ...channelSettings } = updateSendgridChannelDto;

    const channel = sendgridChannels.find((channel) => channel.id === id);
    if (!channel) throw new NotFoundException('Channel not found');

    await this.workspaceSendgridConnectionRepository.save({
      ...channel,
      ...channelSettings,
      id,
      workspace: { id: workspace.id },
    });

    if (!sendingOptions) return;

    await this.sendgridSendingOptionRepository.delete({
      sendgridConnection: { id: channel.id },
    });

    if (sendingOptions.length === 0) return;

    await this.sendgridSendingOptionRepository.save(
      sendingOptions.map((option) => ({
        ...option,
        sendgridConnection: { id: channel.id },
      }))
    );
  }

  public async createResendChannel(
    account: Account,
    createResendChannelDto: CreateResendChannelDto
  ) {
    const workspace = account.currentWorkspace;
    const { sendingOptions, ...channelSettings } = createResendChannelDto;

    const connection = await this.workspaceResendConnectionRepository.save({
      ...channelSettings,
      workspace: { id: workspace.id },
    });

    if (sendingOptions.length === 0) return;

    await this.resendSendingOptionRepository.save(
      sendingOptions.map((option) => ({
        ...option,
        resendConnection: { id: connection.id },
      }))
    );
  }

  public async updateResendChannel(
    account: Account,
    id: string,
    updateResendChannelDto: UpdateResendChannelDto
  ) {
    const workspace = account.currentWorkspace;

    const resendChannels = (await this.getSpecificChannels(
      account,
      MessageChannel.RESEND
    )) as WorkspaceResendConnection[];

    const { sendingOptions, ...channelSettings } = updateResendChannelDto;

    const channel = resendChannels.find((channel) => channel.id === id);
    if (!channel) throw new NotFoundException('Channel not found');

    await this.workspaceResendConnectionRepository.save({
      ...channel,
      ...channelSettings,
      id,
      workspace: { id: workspace.id },
    });

    if (!sendingOptions) return;

    await this.resendSendingOptionRepository.delete({
      resendConnection: { id: channel.id },
    });

    if (sendingOptions.length === 0) return;

    await this.resendSendingOptionRepository.save(
      sendingOptions.map((option) => ({
        ...option,
        resendConnection: { id: channel.id },
      }))
    );
  }

  public async createTwilioChannel(
    account: Account,
    createTwilioChannelDto: CreateTwilioChannelDto
  ) {
    const workspace = account.currentWorkspace;

    await this.workspaceTwilioConnectionRepository.save({
      ...createTwilioChannelDto,
      workspace: { id: workspace.id },
    });
  }

  public async updateTwilioChannel(
    account: Account,
    id: string,
    updateTwilioChannelDto: UpdateTwilioChannelDto
  ) {
    const workspace = account.currentWorkspace;

    const channel = await this.workspaceTwilioConnectionRepository.findOneBy({
      id,
      workspace: { id: workspace.id },
    });
    if (!channel) throw new NotFoundException('Channel not found');

    await this.workspaceTwilioConnectionRepository.save({
      ...channel,
      ...updateTwilioChannelDto,
      id: channel.id,
      workspace: { id: workspace.id },
    });
  }

  public async createPushChannel(
    account: Account,
    createPushChannelDto: CreatePushChannelDto
  ) {
    const workspace = account.currentWorkspace;

    const platform =
      createPushChannelDto.pushPlatforms?.Android ||
      createPushChannelDto.pushPlatforms?.iOS;
    if (!platform) throw new BadRequestException('No platform given');

    await this.accountsService.validateFirebase(
      account,
      platform.credentials,
      ''
    );

    await this.workspacePushConnectionRepository.save({
      ...createPushChannelDto,
      workspace: { id: workspace.id },
    });
  }

  public async updatePushChannel(
    account: Account,
    id: string,
    updatePushChannelDto: UpdatePushChannelDto
  ) {
    const workspace = account.currentWorkspace;

    const channel = await this.workspacePushConnectionRepository.findOneBy({
      id,
      workspace: { id: workspace.id },
    });
    if (!channel) throw new NotFoundException('Channel not found');

    if (updatePushChannelDto.pushPlatforms) {
      const platform =
        updatePushChannelDto.pushPlatforms?.Android ||
        updatePushChannelDto.pushPlatforms?.iOS;
      if (!platform) throw new BadRequestException('No platform given');

      await this.accountsService.validateFirebase(
        account,
        platform.credentials,
        ''
      );
    }

    await this.workspacePushConnectionRepository.save({
      ...channel,
      ...updatePushChannelDto,
      id: channel.id,
      workspace: { id: workspace.id },
    });
  }
}
