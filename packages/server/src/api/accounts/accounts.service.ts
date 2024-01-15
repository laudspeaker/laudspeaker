import { BaseJwtHelper } from '../../common/helper/base-jwt.helper';
import {
  BadRequestException,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Account } from './entities/accounts.entity';
import * as bcrypt from 'bcryptjs';
import { CustomersService } from '../customers/customers.service';
import { AuthService } from '../auth/auth.service';
import { MailService } from '@sendgrid/mail';
import { Client } from '@sendgrid/client';
import { RemoveAccountDto } from './dto/remove-account.dto';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose, { ClientSession } from 'mongoose';
import { WebhooksService } from '../webhooks/webhooks.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { JourneysService } from '../journeys/journeys.service';
import { TemplatesService } from '../templates/templates.service';
import {
  PushPlatforms,
  TemplateType,
} from '../templates/entities/template.entity';
import onboardingJourneyFixtures from './onboarding-journey';
import { StepsService } from '../steps/steps.service';
import { StepType } from '../steps/types/step.interface';
import { randomUUID } from 'crypto';
import admin from 'firebase-admin';
import { update } from 'lodash';
import { Workspaces } from '../workspaces/entities/workspaces.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { OrganizationTeam } from '../organizations/entities/organization-team.entity';

@Injectable()
export class AccountsService extends BaseJwtHelper {
  private sgMailService = new MailService();
  private sgClient = new Client();

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private dataSource: DataSource,
    @InjectRepository(Account)
    public accountsRepository: Repository<Account>,
    @InjectRepository(Workspaces)
    public workspacesRepository: Repository<Workspaces>,
    @Inject(forwardRef(() => CustomersService))
    private customersService: CustomersService,
    @Inject(forwardRef(() => AuthService)) private authService: AuthService,
    @Inject(forwardRef(() => JourneysService))
    private journeysService: JourneysService,
    @Inject(forwardRef(() => TemplatesService))
    private templatesService: TemplatesService,
    @Inject(forwardRef(() => StepsService))
    private stepsService: StepsService,
    @InjectConnection() private readonly connection: mongoose.Connection,
    private webhookService: WebhooksService
  ) {
    super();
    if (
      process.env.ONBOARDING_ACCOUNT_EMAIL &&
      process.env.ONBOARDING_ACCOUNT_API_KEY &&
      process.env.ONBOARDING_ACCOUNT_PASSWORD
    )
      this.createOnboadingAccount();
  }

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: AccountsService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }
  debug(message, method, session, user = 'ANONYMOUS') {
    this.logger.debug(
      message,
      JSON.stringify({
        class: AccountsService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }
  warn(message, method, session, user = 'ANONYMOUS') {
    this.logger.warn(
      message,
      JSON.stringify({
        class: AccountsService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }
  error(error, method, session, user = 'ANONYMOUS') {
    this.logger.error(
      error.message,
      error.stack,
      JSON.stringify({
        class: AccountsService.name,
        method: method,
        session: session,
        cause: error.cause,
        name: error.name,
        user: user,
      })
    );
  }
  verbose(message, method, session, user = 'ANONYMOUS') {
    this.logger.verbose(
      message,
      JSON.stringify({
        class: AccountsService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  findAll(): Promise<Account[]> {
    return this.accountsRepository.find({
      relations: ['teams.organization.workspaces'],
    });
  }

  async findOrganizationOwnerByWorkspaceId(
    id: string,
    session: string
  ): Promise<Account> {
    try {
      const owner = (
        await this.workspacesRepository.findOne({
          where: {
            id,
          },
          relations: { organization: { owner: true } },
        })
      ).organization.owner;

      const account = await this.accountsRepository.findOne({
        where: {
          id: owner.id,
        },
        relations: ['teams.organization.workspaces'],
      });

      if (!account) {
        const e = new NotFoundException('Account not found');
        throw e;
      }

      this.debug(
        `Found ${JSON.stringify(account)}`,
        this.findOrganizationOwnerByWorkspaceId.name,
        session,
        id
      );
      return account;
    } catch (e) {
      this.error(e, this.findOrganizationOwnerByWorkspaceId.name, session, id);
      throw e;
    }
  }

  async findOne(
    user: Express.User | { id: string },
    session: string
  ): Promise<Account> {
    try {
      const account = await this.accountsRepository.findOne({
        where: { id: (<Account>user).id },
        relations: ['teams.organization.workspaces'],
      });

      if (!account) {
        const e = new NotFoundException('Account not found');
        throw e;
      }

      this.debug(
        `Found ${JSON.stringify(account)}`,
        this.findOne.name,
        session,
        (<Account>user).id
      );
      return account;
    } catch (e) {
      this.error(e, this.findOne.name, session, (<Account>user).id);
      throw e;
    }
  }

  async findOneByAPIKey(apiKey: string): Promise<Account | undefined> {
    if (!apiKey) return undefined;

    const workspace = await this.workspacesRepository.findOne({
      where: {
        apiKey,
      },
      relations: ['organization.owner'],
    });

    const account = await this.accountsRepository.findOne({
      where: {
        id: workspace.organization.owner.id,
      },
      relations: ['teams.organization.workspaces'],
    });

    return account;
  }

  async update(
    user: Express.User,
    updateUserDto: UpdateAccountDto,
    session: string
  ): Promise<Account> {
    const oldUser = await this.findOne(user, session);
    // if user change password
    let password = oldUser.password;

    let verificationKey = '';

    if (updateUserDto.emailProvider === 'mailgun') {
      try {
        await this.webhookService.setupMailgunWebhook(
          updateUserDto.mailgunAPIKey,
          updateUserDto.sendingDomain
        );
      } catch (e) {
        this.error(e, this.update.name, session);
        throw e;
      }
    }

    if (
      updateUserDto.emailProvider === 'sendgrid' &&
      updateUserDto.sendgridFromEmail &&
      updateUserDto.sendgridApiKey
    ) {
      try {
        this.sgMailService.setApiKey(updateUserDto.sendgridApiKey);
        await this.sgMailService.send({
          subject: 'Sendgrid connection to Laudspeaker',
          from: updateUserDto.sendgridFromEmail,
          to: oldUser.email,
          html: '<h1>If you see this message, you successfully connected your sendgrid email to laudspeaker</h1>',
        });

        this.sgClient.setApiKey(updateUserDto.sendgridApiKey);
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
        const [_, body] = await this.sgClient.request({
          url: `/v3/user/webhooks/event/settings/signed`,
          method: 'PATCH',
          body: {
            enabled: true,
          },
        });
        verificationKey = body.public_key;
      } catch (e) {
        this.error(e, this.update.name, session, oldUser.email);
        throw e;
        // throw new BadRequestException(
        //   'There is something wrong with your sendgrid account. Check if your email is verified'
        // );
      }
    }

    if (updateUserDto.newPassword) {
      const isPasswordValid: boolean = bcrypt.compareSync(
        updateUserDto.currentPassword,
        password
      );

      if (!isPasswordValid) {
        throw new HttpException(
          'Invalid current password',
          HttpStatus.BAD_REQUEST
        );
      }

      if (updateUserDto.newPassword !== updateUserDto.verifyNewPassword)
        throw new HttpException("Passwords don't match", 400);

      password = this.encodePassword(updateUserDto.newPassword);
      delete updateUserDto.currentPassword;
      delete updateUserDto.newPassword;
      delete updateUserDto.verifyNewPassword;
    }

    if (updateUserDto.expectedOnboarding) {
      oldUser.currentOnboarding = [];
    }

    if (
      updateUserDto.finishedOnboarding &&
      !oldUser.currentOnboarding.includes(updateUserDto.finishedOnboarding) &&
      oldUser.expectedOnboarding.includes(updateUserDto.finishedOnboarding)
    ) {
      oldUser.currentOnboarding.push(updateUserDto.finishedOnboarding);
      delete updateUserDto.finishedOnboarding;
      updateUserDto.onboarded =
        oldUser.expectedOnboarding.length === oldUser.currentOnboarding.length;
    }

    const transactionSession = await this.connection.startSession();
    transactionSession.startTransaction();

    let verified = oldUser.verified;
    const needEmailUpdate =
      updateUserDto.email && oldUser.email !== updateUserDto.email;
    if (needEmailUpdate) {
      verified = false;
    }

    if (updateUserDto.firebaseCredentials) {
      try {
        const app = admin.app(oldUser.id);
        if (app) app.delete();
      } catch (e) {
        // do nothing
      }
    }

    if (updateUserDto.emailProvider === 'free3' && !verified)
      throw new HttpException(
        'Email has to be verified to use this',
        HttpStatus.BAD_REQUEST
      );

    if (updateUserDto.pushPlatforms) {
      const platform =
        updateUserDto.pushPlatforms.Android || updateUserDto.pushPlatforms.iOS;
      await this.validateFirebase(oldUser, platform.credentials, session);
    }

    const { smsAccountSid, smsAuthToken, smsFrom } = updateUserDto;

    const smsDetails = [smsAccountSid, smsAuthToken, smsFrom];

    if (smsDetails.some((item) => !!item) && smsDetails.some((item) => !item))
      throw new HttpException(
        'Both sms account sid, sms auth token and sms from number must be provided',
        HttpStatus.BAD_REQUEST
      );

    const queryRunner = await this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let err;
    try {
      const workspace = oldUser.teams?.[0]?.organization?.workspaces?.[0];
      for (const key of Object.keys(updateUserDto)) {
        if (key === 'pushPlatforms' && updateUserDto[key]) {
          oldUser[key] = {
            Android:
              updateUserDto.pushPlatforms.Android || oldUser[key].Android,
            iOS: updateUserDto.pushPlatforms.iOS || oldUser[key].iOS,
          };
        } else oldUser[key] = updateUserDto[key];
      }

      oldUser.password = password;
      oldUser.verified = verified;

      const {
        timezoneUTCOffset,
        mailgunAPIKey,
        sendingDomain,
        sendingEmail,
        sendingName,
        slackTeamId,
        posthogApiKey,
        posthogProjectId,
        posthogHostUrl,
        posthogSmsKey,
        posthogEmailKey,
        posthogFirebaseDeviceTokenKey,
        emailProvider,
        testSendingEmail,
        testSendingName,
        sendgridApiKey,
        sendgridFromEmail,
        smsAccountSid,
        smsAuthToken,
        smsFrom,
        pushPlatforms,
        resendSendingDomain,
        resendAPIKey,
        resendSendingName,
        resendSendingEmail,
      } = updateUserDto;

      const newWorkspace = {
        id: workspace.id,
        timezoneUTCOffset,
        mailgunAPIKey,
        sendingDomain,
        sendingEmail,
        sendingName,
        slackTeamId,
        posthogApiKey,
        posthogProjectId,
        posthogHostUrl,
        posthogSmsKey,
        posthogEmailKey,
        posthogFirebaseDeviceTokenKey,
        emailProvider,
        testSendingEmail,
        testSendingName,
        sendgridApiKey,
        sendgridFromEmail,
        sendgridVerificationKey: verificationKey,
        smsAccountSid,
        smsAuthToken,
        smsFrom,
        pushPlatforms,
        resendSendingDomain,
        resendAPIKey,
        resendSendingName,
        resendSendingEmail,
      };

      const updatedUser = await queryRunner.manager.save(oldUser);
      await queryRunner.manager.save(Workspaces, newWorkspace);

      if (needEmailUpdate)
        await this.authService.requestVerification(
          updatedUser,
          queryRunner,
          session
        );

      await transactionSession.commitTransaction();
      await queryRunner.commitTransaction();

      return updatedUser;
    } catch (e) {
      await transactionSession.abortTransaction();
      err = e;
      this.error(e, this.update.name, session);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
      await transactionSession.endSession();
    }
    if (err) throw err;
  }

  async updateApiKey(user: Express.User, session: string): Promise<string> {
    try {
      const newKey = this.generateApiKey();
      this.debug(
        `Generated API Key ${JSON.stringify({ apiKey: newKey })}`,
        this.updateApiKey.name,
        session,
        (<Account>user).id
      );
      const oldUser = await this.findOne(user, session);
      this.debug(
        `Found user: ${JSON.stringify({ id: oldUser.id })}`,
        this.updateApiKey.name,
        session,
        (<Account>user).id
      );
      await this.accountsRepository.save({
        ...oldUser,
        apiKey: newKey,
      });
      this.debug(
        `Updated User's API Key ${JSON.stringify({
          apiKey: newKey,
          id: oldUser.id,
        })}`,
        this.updateApiKey.name,
        session,
        (<Account>user).id
      );
      return newKey;
    } catch (e) {
      this.error(e, this.updateApiKey.name, session, (<Account>user).id);
      throw e;
    }
  }

  async remove(
    user: Express.User,
    removeAccountDto: RemoveAccountDto,
    session: string
  ): Promise<void> {
    let transactionSession: ClientSession;
    try {
      const account = await this.findOne(user, session);
      this.debug(
        `Found ${JSON.stringify({ id: account.id })}`,
        this.remove.name,
        session,
        (<Account>user).id
      );
      const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

      if (!bcrypt.compareSync(removeAccountDto.password, account.password))
        throw new BadRequestException('Password is incorrect');

      transactionSession = await this.connection.startSession();
      transactionSession.startTransaction();

      await this.customersService.CustomerModel.deleteMany(
        {
          workspaceId: workspace.id,
        },
        { session: transactionSession }
      )
        .session(transactionSession)
        .exec();
      this.debug(
        `Deleted customers for ${JSON.stringify({ id: account.id })}`,
        this.remove.name,
        session,
        (<Account>user).id
      );

      await this.customersService.CustomerKeysModel.deleteMany(
        {
          workspaceId: workspace.id,
        },
        { session: transactionSession }
      )
        .session(transactionSession)
        .exec();
      this.debug(
        `Deleted customer keys for ${JSON.stringify({ id: account.id })}`,
        this.remove.name,
        session,
        (<Account>user).id
      );

      await this.accountsRepository.delete(account.id);
      this.debug(
        `Deleted ${JSON.stringify({ id: account.id })}`,
        this.remove.name,
        session,
        (<Account>user).id
      );

      await transactionSession.commitTransaction();
    } catch (e) {
      await transactionSession.abortTransaction();
      this.error(e, this.remove.name, session, (<Account>user).id);
      throw e;
    } finally {
      await transactionSession.endSession();
    }
  }

  async createOnboadingAccount() {
    const session = 'onboarding-creation';

    let account = await this.accountsRepository.findOne({
      where: {
        email: process.env.ONBOARDING_ACCOUNT_EMAIL,
      },
    });

    if (!account) {
      const queryRunner = await this.dataSource.createQueryRunner();

      account = await queryRunner.manager.save(Account, {
        email: process.env.ONBOARDING_ACCOUNT_EMAIL,
        apiKey: process.env.ONBOARDING_ACCOUNT_API_KEY,
        password: this.authService.helper.encodePassword(
          process.env.ONBOARDING_ACCOUNT_PASSWORD
        ),
        verified: true,
      });

      try {
        await queryRunner.connect();
        await queryRunner.startTransaction();

        const organization = await queryRunner.manager.create(Organization, {
          companyName: 'OnboardingOrg',
          owner: {
            id: account.id,
          },
        });
        await queryRunner.manager.save(organization);

        const workspace = await queryRunner.manager.create(Workspaces, {
          name: organization.companyName + ' workspace',
          organization,
          apiKey: process.env.ONBOARDING_ACCOUNT_API_KEY,
          timezoneUTCOffset: 'UTC+00:00',
        });
        await queryRunner.manager.save(workspace);

        const team = await queryRunner.manager.create(OrganizationTeam, {
          teamName: 'Default team',
          organization,
          members: [
            {
              id: account.id,
            },
          ],
        });
        await queryRunner.manager.save(team);

        await queryRunner.commitTransaction();
      } catch (err) {
        await queryRunner.rollbackTransaction();
        this.error(err, this.update, session, account.id);
        throw new BadRequestException(
          'Error during onboarding account organization creation'
        );
      }
    }

    account = await this.accountsRepository.findOne({
      where: {
        email: process.env.ONBOARDING_ACCOUNT_EMAIL,
      },
      relations: ['teams.organization.workspaces'],
    });

    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    let trackerTemplate = await this.templatesService.findOne(
      account,
      'onboarding-template',
      session
    );

    if (!trackerTemplate) {
      trackerTemplate = await this.templatesService.create(
        account,
        {
          name: 'onboarding-template',
          text: null,
          style: null,
          subject: null,
          cc: [],
          slackMessage: null,
          type: TemplateType.CUSTOM_COMPONENT,
          smsText: null,
          pushObject: null,
          webhookData: null,
          modalState: null,
          customEvents: [
            'show-start-journey-page',
            'show-customers-page',
            'show-track-performance-page',
            'onboarding-start',
            'reset',
            'proceed-to-drag-email-step',
            'proceed-to-setting-panel-step',
            'proceed-to-select-template-step',
            'proceed-to-save-settings-step',
            'proceed-to-trigger-step',
            'proceed-to-modify-trigger-step',
            'proceed-to-change-time-step',
            'proceed-to-save-trigger-step',
            'proceed-to-finish-step',
            'show-create-journey-page',
            'restart',
          ],
          customFields: {
            fields: [
              {
                name: 'page',
                type: 'Number',
                defaultValue: '0',
              },
              {
                name: 'step',
                type: 'Number',
                defaultValue: '0',
              },
            ],
          },
        },
        session
      );
    }

    let journey = await this.journeysService.journeysRepository.findOneBy({
      workspace: {
        id: workspace.id,
      },
      name: 'onboarding',
    });
    if (!journey) {
      journey = await this.journeysService.create(
        account,
        'onboarding',
        session
      );

      await this.journeysService.update(
        account,
        {
          id: journey.id,
          isDynamic: true,
        },
        session
      );
      await this.journeysService.updateLayout(
        account,
        {
          id: journey.id,
          nodes: await Promise.all(
            onboardingJourneyFixtures(trackerTemplate.id).nodes.map(
              async (node) => ({
                ...node,
                data: {
                  ...node.data,
                  stepId:
                    (
                      await this.stepsService.findOne(
                        account,
                        node.data.stepId,
                        session
                      )
                    )?.id ||
                    (node.data.type
                      ? (
                          await this.stepsService.insert(
                            account,
                            {
                              journeyID: journey.id,
                              type: node.data.type as StepType,
                            },
                            session
                          )
                        ).id
                      : undefined),
                },
              })
            )
          ),
          edges: onboardingJourneyFixtures(trackerTemplate.id).edges,
        },
        ''
      );
      await this.journeysService.start(account, journey.id, '');
    }
  }

  async validateFirebase(
    user: Account,
    credentials: Express.Multer.File | JSON,
    session: string,
    withSave?: {
      platform: PushPlatforms;
    }
  ) {
    let content = '';
    if ((credentials as Express.Multer.File).buffer) {
      content = (credentials as Express.Multer.File).buffer.toString('utf-8');
    } else {
      content = JSON.stringify(credentials as JSON);
    }

    try {
      const serviceAccount = JSON.parse(content);
      const firebaseApp = admin.initializeApp(
        {
          credential: admin.credential.cert(serviceAccount),
        },
        withSave ? `${user.id};;${withSave.platform}` : undefined
      );
      if (!withSave) firebaseApp.delete();

      return serviceAccount;
    } catch (error) {
      this.error(
        error,
        this.validateFirebase.name,
        session,
        (<Account>user).id
      );
      throw new HttpException(
        'Error during message processing.',
        HttpStatus.BAD_REQUEST
      );
    }
  }
}
