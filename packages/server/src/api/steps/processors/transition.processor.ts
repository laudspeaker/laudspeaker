/* eslint-disable no-case-declarations */
import { HttpException, HttpStatus, Inject, Logger } from '@nestjs/common';
import * as http from 'node:http';
import https from 'https';
import { Injectable } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import {
  Processor,
  WorkerHost,
  InjectQueue,
  OnQueueEvent,
  QueueEventsListener,
  OnWorkerEvent,
} from '@nestjs/bullmq';
import { Job, MetricsTime, Queue } from 'bullmq';
import { cpus } from 'os';
import {
  CustomComponentAction,
  ExperimentBranch,
  StepType,
} from '../types/step.interface';
import { Step } from '../entities/step.entity';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Temporal } from '@js-temporal/polyfill';
import { createHash, randomUUID } from 'crypto';
import { MessageSender } from '../types/messagesender.class';
import {
  ClickHouseEventProvider,
  WebhooksService,
} from '@/api/webhooks/webhooks.service';
import { TemplatesService } from '@/api/templates/templates.service';
import { CustomersService } from '@/api/customers/customers.service';
import { cleanTagsForSending } from '../../../shared/utils/helpers';
import {
  Customer,
  CustomerDocument,
} from '@/api/customers/schemas/customer.schema';
import {
  Template,
  TemplateType,
} from '@/api/templates/entities/template.entity';
import { WebsocketGateway } from '@/websockets/websocket.gateway';
import { ModalsService } from '@/api/modals/modals.service';
import { SlackService } from '@/api/slack/slack.service';
import { Account } from '@/api/accounts/entities/accounts.entity';
import { RedlockService } from '@/api/redlock/redlock.service';
import * as _ from 'lodash';
import { PostHog } from 'posthog-node';
import * as Sentry from '@sentry/node';
import { JourneyLocationsService } from '@/api/journeys/journey-locations.service';
import { JourneysService } from '@/api/journeys/journeys.service';
import { convertTimeToUTC, isWithinInterval } from '@/common/helper/timing';
import { JourneySettingsQuietFallbackBehavior } from '@/api/journeys/types/additional-journey-settings.interface';
import { StepsService } from '../steps.service';
import { Journey } from '@/api/journeys/entities/journey.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Workspaces } from '@/api/workspaces/entities/workspaces.entity';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { JourneyLocation } from '@/api/journeys/entities/journey-location.entity';

@Injectable()
@Processor('transition', {
  removeOnComplete: { count: 100000 },
  metrics: {
    maxDataPoints: MetricsTime.ONE_HOUR,
  },
  concurrency: 5,
})
export class TransitionProcessor extends WorkerHost {
  private phClient = new PostHog('RxdBl8vjdTwic7xTzoKTdbmeSC1PCzV6sw-x-FKSB-k');

  constructor(
    private dataSource: DataSource,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @InjectQueue('transition') private readonly transitionQueue: Queue,
    @InjectQueue('webhooks') private readonly webhooksQueue: Queue,
    @InjectConnection() private readonly connection: mongoose.Connection,
    @InjectRepository(Workspaces)
    private workspacesRepository: Repository<Workspaces>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @Inject(WebhooksService)
    private readonly webhooksService: WebhooksService,
    @Inject(CustomersService)
    private readonly customersService: CustomersService,
    @Inject(TemplatesService)
    private readonly templatesService: TemplatesService,
    @Inject(WebsocketGateway)
    private websocketGateway: WebsocketGateway,
    @Inject(ModalsService) private modalsService: ModalsService,
    @Inject(SlackService) private slackService: SlackService,
    @InjectModel(Customer.name) public customerModel: Model<CustomerDocument>,
    @Inject(JourneysService) private journeysService: JourneysService,
    @Inject(RedlockService) private redlockService: RedlockService,
    @Inject(JourneyLocationsService)
    private journeyLocationsService: JourneyLocationsService,
    @Inject(StepsService) private stepsService: StepsService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache
  ) {
    super();
  }

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: TransitionProcessor.name,
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
        class: TransitionProcessor.name,
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
        class: TransitionProcessor.name,
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
        class: TransitionProcessor.name,
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
        class: TransitionProcessor.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  async process(
    job: Job<
      {
        step: Step;
        owner: Account;
        journey: Journey;
        customer: CustomerDocument;
        location: JourneyLocation;
        session: string;
        event?: string;
        branch?: number;
      },
      any,
      string
    >
  ): Promise<any> {
    let err: any;
    try {
      switch (job.data.step.type) {
        case StepType.START:
          await this.handleStart(
            job.data.owner,
            job.data.journey,
            job.data.step,
            job.data.session,
            job.data.customer,
            job.data.location,
            job.data.event
          );
          break;
        case StepType.EXIT:
          await this.handleExit(
            job.data.owner,
            job.data.journey,
            job.data.step,
            job.data.session,
            job.data.customer,
            job.data.location
          );
          break;
        case StepType.MESSAGE:
          await this.handleMessage(
            job.data.owner,
            job.data.journey,
            job.data.step,
            job.data.session,
            job.data.customer,
            job.data.location,
            job.data.event
          );
          break;
        case StepType.LOOP:
          await this.handleLoop(
            job.data.owner,
            job.data.journey,
            job.data.step,
            job.data.session,
            job.data.customer,
            job.data.location,
            job.data.event
          );
          break;
        case StepType.AB_TEST:
          break;
        case StepType.MULTISPLIT:
          await this.handleMultisplit(
            job.data.owner,
            job.data.journey,
            job.data.step,
            job.data.session,
            job.data.customer,
            job.data.location,
            job.data.event
          );
          break;
        case StepType.TRACKER:
          //   await this.handleCustomComponent(
          //     job.data.owner,
          //     job.data.journey,
          //     job.data.step,
          //     job.data.session,
          //     job.data.customerID,
          //     queryRunner,
          //     transactionSession,
          //     job.data.event
          //   );
          break;
        case StepType.TIME_DELAY:
          await this.handleTimeDelay(
            job.data.owner,
            job.data.journey,
            job.data.step,
            job.data.session,
            job.data.customer,
            job.data.location,
            job.data.event
          );
          break;
        case StepType.TIME_WINDOW:
          await this.handleTimeWindow(
            job.data.owner,
            job.data.journey,
            job.data.step,
            job.data.session,
            job.data.customer,
            job.data.location,
            job.data.event
          );
          break;
        case StepType.WAIT_UNTIL_BRANCH:
          await this.handleWaitUntil(
            job.data.owner,
            job.data.journey,
            job.data.step,
            job.data.session,
            job.data.customer,
            job.data.location,
            job.data.event,
            job.data.branch
          );
          break;
        case StepType.EXPERIMENT:
          await this.handleExperiment(
            job.data.owner,
            job.data.journey,
            job.data.step,
            job.data.session,
            job.data.customer,
            job.data.location,
            job.data.event
          );
          break;
        default:
          break;
      }
      // await queryRunner.commitTransaction();
    } catch (e) {
      this.error(e, this.process.name, job.data.session);
      err = e;
      // await queryRunner.rollbackTransaction();
    } finally {
      // await queryRunner.release();
    }
    if (err) throw err;
  }

  /**
   * Handle custom component step;
   * @param stepID
   * @param session
   * @param queryRunner
   * @param transactionSession
   */
  async handleCustomComponent(
    ownerID: string,
    stepID: string,
    session: string,
    customerID: string,
    journeyID: string,
    queryRunner: QueryRunner,
    transactionSession: mongoose.mongo.ClientSession,
    event?: string
  ) {
    /**
     * Boilerplate Step One Start
     */
    const owner = await queryRunner.manager.findOne(Account, {
      where: { id: ownerID },
      relations: ['teams.organization.workspaces'],
    });
    const workspace = owner.teams?.[0]?.organization?.workspaces?.[0];

    const journey = await this.journeysService.findByID(
      owner,
      journeyID,
      session,
      queryRunner
    );

    const currentStep = await queryRunner.manager.findOne(Step, {
      where: {
        id: stepID,
        type: StepType.TRACKER,
      },
      lock: { mode: 'pessimistic_write' },
    });

    const customer = await this.customersService.findById(owner, customerID);

    const location = await this.journeyLocationsService.findForWrite(
      journey,
      customer,
      session,
      owner,
      queryRunner
    );

    if (!location) {
      this.warn(
        `${JSON.stringify({
          warning: 'Customer not in step',
          customerID,
          currentStep,
        })}`,
        this.handleCustomComponent.name,
        session,
        owner.email
      );
      return;
    }

    const nextStep = await queryRunner.manager.findOne(Step, {
      where: {
        id: currentStep.metadata.destination,
      },
    });
    /**
     * Boilerplate Step One Finish
     */

    /**
     * Step Business Logic Start
     */
    const templateID = currentStep.metadata.template;
    const template = await this.templatesService.transactionalFindOneById(
      owner,
      templateID.toString(),
      queryRunner
    );

    if (template.type !== TemplateType.CUSTOM_COMPONENT) {
      throw new Error(
        `Cannot use ${template.type} template for a custom component step`
      );
    }
    const { action, humanReadableName, pushedValues } = currentStep.metadata;

    //1. Check if custom components exists on this customer
    if (!customer.customComponents) customer.customComponents = {};

    // 2. Check if this specific component exists on this customer,
    // If not, create it and put in the default values from the template
    if (!customer.customComponents[humanReadableName])
      customer.customComponents[humanReadableName] = {
        hidden: true,
        ...template.customFields,
        delivered: false,
      };

    // 3. Update the custom component to reflect the
    // details outlined in the step that triggers this component.
    customer.customComponents[humanReadableName].hidden =
      action === CustomComponentAction.HIDE ? true : false;
    customer.customComponents[humanReadableName].step = stepID;
    customer.customComponents[humanReadableName].template = String(templateID);
    customer.customComponents[humanReadableName] = {
      ...customer.customComponents[humanReadableName],
      ...pushedValues,
    };

    // 4. Record that the message was sent
    await this.webhooksService.insertMessageStatusToClickhouse(
      [
        {
          stepId: stepID,
          createdAt: new Date().toISOString(),
          customerId: customerID,
          event: 'sent',
          eventProvider: ClickHouseEventProvider.TRACKER,
          messageId: humanReadableName,
          templateId: String(templateID),
          workspaceId: workspace.id,
          processed: true,
        },
      ],
      session
    );

    // 5. Attempt delivery. If delivered, record delivery event
    const isDelivered = await this.websocketGateway.sendCustomComponentState(
      customer.id,
      humanReadableName,
      customer.customComponents[humanReadableName]
    );
    await this.websocketGateway.sendProcessed(
      customer.id,
      event,
      humanReadableName
    );
    if (isDelivered)
      await this.webhooksService.insertMessageStatusToClickhouse(
        [
          {
            stepId: stepID,
            createdAt: new Date().toISOString(),
            customerId: customerID,
            event: 'delivered',
            eventProvider: ClickHouseEventProvider.TRACKER,
            messageId: humanReadableName,
            templateId: String(templateID),
            workspaceId: workspace.id,
            processed: true,
          },
        ],
        session
      );

    // 6. Set delivery status.
    customer.customComponents[humanReadableName].delivered = isDelivered;

    // 7. Commit customer changes to the db
    const res = await this.customerModel
      .findByIdAndUpdate(customer.id, {
        $set: { customComponents: { ...customer.customComponents } },
      })
      .session(transactionSession)
      .exec();
    this.debug(
      `${JSON.stringify({ res: res })}`,
      this.handleCustomComponent.name,
      session
    );
    this.phClient.capture({
      distinctId: owner.email,
      event: 'message_sent',
      properties: {
        type: 'custom_component',
        step: stepID,
        customer: customerID,
        template: templateID,
        provider: ClickHouseEventProvider.TRACKER,
      },
    });

    /**
     * Step Business Logic Finish
     */

    /**
     * Boilerplate Step Two Start
     */
    if (nextStep) {
      // Destination exists, move customer into destination
      nextStep.customers.push(
        JSON.stringify({
          customerID,
          timestamp: Temporal.Now.instant().toString(),
        })
      );
      _.remove(currentStep.customers, (customer) => {
        return JSON.parse(customer).customerID === customerID;
      });
      await queryRunner.manager.save(currentStep);
      const newNext = await queryRunner.manager.save(nextStep);

      if (
        newNext.type !== StepType.TIME_DELAY &&
        newNext.type !== StepType.TIME_WINDOW &&
        newNext.type !== StepType.WAIT_UNTIL_BRANCH
      )
        await this.transitionQueue.add(newNext.type, {
          ownerID,
          step: newNext,
          session: session,
          customerID,
          journeyID,
          event,
        });
      else {
        await this.journeyLocationsService.unlock(location, null);
        this.warn(
          `${JSON.stringify({ warning: 'Releasing lock' })}`,
          this.handleCustomComponent.name,
          session,
          owner.email
        );
      }
    } else {
      // Destination does not exist, customer has stopped moving so
      // we can release lock
      await this.journeyLocationsService.unlock(location, null);
      this.warn(
        `${JSON.stringify({ warning: 'Releasing lock' })}`,
        this.handleCustomComponent.name,
        session,
        owner.email
      );
    }
    /**
     * Boilerplate Step Two Finish
     */
  }

  /**
   * Handle message step;
   * @param stepID
   * @param session
   * @param queryRunner
   * @param transactionSession
   */
  async handleMessage(
    owner: Account,
    journey: Journey,
    step: Step,
    session: string,
    customer: CustomerDocument,
    location: JourneyLocation,
    event?: string
  ) {
    let job;
    const workspace = owner.teams?.[0]?.organization?.workspaces?.[0];

    // Rate limiting and sending quiet hours will be stored here
    type MessageSendType =
      | 'SEND' // should send
      | 'QUIET_REQUEUE' // quiet hours, requeue message when quiet hours over
      | 'QUIET_ABORT' // quiet hours, abort message, move to next step
      | 'LIMIT_REQUEUE' // messages per minute rate limit hit, requeue for next minute
      | 'LIMIT_HOLD' // customers messaged per journey rate limit hit, hold at current
      | 'MOCK_SEND'; // mock message send, don't actually send message
    // Initial default is 'SEND'
    let messageSendType: MessageSendType = 'SEND';
    let requeueTime: Date;
    if (
      journey.journeySettings &&
      journey.journeySettings.quietHours &&
      journey.journeySettings.quietHours.enabled
    ) {
      const quietHours = journey.journeySettings.quietHours!;
      // CHECK IF SENDING QUIET HOURS
      const formatter = Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h24',
        timeZone: 'UTC',
      });
      const now = new Date();
      const utcNowString = formatter.format(now);
      const utcStartTime = convertTimeToUTC(
        quietHours.startTime,
        workspace.timezoneUTCOffset
      );
      const utcEndTime = convertTimeToUTC(
        quietHours.endTime,
        workspace.timezoneUTCOffset
      );
      const isQuietHour = isWithinInterval(
        utcStartTime,
        utcEndTime,
        utcNowString
      );

      this.phClient.capture({
        distinctId: owner.email,
        event: 'logging_quiet_hours',
        properties: {
          now: Date.now(),
          utcNowString,
          utcStartTime,
          utcEndTime,
          isQuietHour,
        },
      });

      if (isQuietHour) {
        switch (quietHours.fallbackBehavior) {
          case JourneySettingsQuietFallbackBehavior.NextAvailableTime:
            messageSendType = 'QUIET_REQUEUE';
            break;
          case JourneySettingsQuietFallbackBehavior.Abort:
            messageSendType = 'QUIET_ABORT';
            break;
          default:
            messageSendType = 'QUIET_REQUEUE';
            this.warn(
              'Unrecognized quiet hours fallback behavior. Defaulting to requeue.',
              this.handleMessage.name,
              session,
              owner.email
            );
        }
        requeueTime = new Date(now);
        requeueTime.setUTCHours(
          parseInt(utcEndTime.split(':')[0]),
          parseInt(utcEndTime.split(':')[1]),
          0,
          0
        );
        if (requeueTime < now) {
          // Date object should handle conversions of new month/new year etc
          requeueTime.setDate(requeueTime.getDate() + 1);
        }
        this.log(
          `Observing quiet hours, now ${now}, quietHours: ${quietHours.startTime}-${quietHours.endTime}, account UTC offset: ${workspace.timezoneUTCOffset}, type ${messageSendType}`,
          this.handleMessage.name,
          session,
          owner.email
        );
      }
    }

    if (messageSendType === 'SEND') {
      // 1. CHECK RATE LIMITING BY UNIQUE CUSTOMERS MESSAGED
      const [customersMessagedLimitEnabled] =
        this.journeysService.rateLimitByCustomersMessagedEnabled(journey);
      if (customersMessagedLimitEnabled) {
        const doRateLimit =
          await this.journeysService.rateLimitByCustomersMessaged(
            owner,
            journey,
            session
          );
        if (doRateLimit) {
          messageSendType = 'LIMIT_HOLD';
        }
      }
    }

    if (messageSendType === 'SEND') {
      // 2. CHECK RATE LIMITING BY NUMBER MESSAGES SENT IN LAST HOUR
      const [rateLimitByMinuteEnabled] =
        this.journeysService.rateLimitByMinuteEnabled(journey);
      if (rateLimitByMinuteEnabled) {
        const doRateLimit = await this.journeysService.rateLimitByMinute(
          owner,
          journey
        );
        if (doRateLimit) {
          messageSendType = 'LIMIT_REQUEUE';
          requeueTime = new Date();
          requeueTime.setMinutes(requeueTime.getMinutes() + 1);
        }
      }
    }

    if (
      messageSendType === 'SEND' &&
      process.env.MOCK_MESSAGE_SEND === 'true'
    ) {
      // 3. CHECK IF MESSAGE SEND SHOULD BE MOCKED
      messageSendType = 'MOCK_SEND';
    }

    if (messageSendType === 'SEND') {
      //send message here
      let template: Template = await this.cacheManager.get(
        `template:${step.metadata.template}`
      );
      if (!template) {
        template = await this.templatesService.lazyFindByID(
          step.metadata.template
        );
        await this.cacheManager.set(
          `template:${step.metadata.destination}`,
          template
        );
      }
      const { email } = owner;

      const {
        mailgunAPIKey,
        sendingName,
        testSendingEmail,
        testSendingName,
        sendgridApiKey,
        sendgridFromEmail,
        resendSendingDomain,
        resendAPIKey,
        resendSendingName,
        resendSendingEmail,
      } = workspace;

      let { sendingDomain, sendingEmail } = workspace;

      let key = mailgunAPIKey;
      let from = sendingName;

      const { _id, workspaceId, workflows, journeys, ...tags } = customer;
      const filteredTags = cleanTagsForSending(tags);
      const sender = new MessageSender(this.accountRepository);

      switch (template.type) {
        case TemplateType.EMAIL:
          if (workspace.emailProvider === 'free3') {
            if (workspace.freeEmailsCount === 0)
              throw new HttpException(
                'You exceeded limit of 3 emails',
                HttpStatus.PAYMENT_REQUIRED
              );
            sendingDomain = process.env.MAILGUN_TEST_DOMAIN;
            key = process.env.MAILGUN_API_KEY;
            from = testSendingName;
            sendingEmail = testSendingEmail;
            workspace.freeEmailsCount--;
          }

          if (workspace.emailProvider === 'resend') {
            sendingDomain = workspace.resendSendingDomain;
            key = workspace.resendAPIKey;
            from = workspace.resendSendingName;
            sendingEmail = workspace.resendSendingEmail;
          }
          if (workspace.emailProvider === 'sendgrid') {
            key = sendgridApiKey;
            from = sendgridFromEmail;
          }
          const ret = await sender.process({
            name: TemplateType.EMAIL,
            accountID: owner.id,
            cc: template.cc,
            customerID: customer._id,
            domain: sendingDomain,
            email: sendingEmail,
            stepID: step.id,
            from: from,
            trackingEmail: email,
            key: key,
            subject: await this.templatesService.parseApiCallTags(
              template.subject,
              filteredTags
            ),
            to: customer.phEmail ? customer.phEmail : customer.email,
            text: await this.templatesService.parseApiCallTags(
              template.text,
              filteredTags
            ),
            tags: filteredTags,
            templateID: template.id,
            eventProvider: workspace.emailProvider,
          });
          this.debug(
            `${JSON.stringify(ret)}`,
            this.handleMessage.name,
            session
          );
          await this.webhooksService.insertMessageStatusToClickhouse(
            ret,
            session
          );
          if (workspace.emailProvider === 'free3') {
            await owner.save();
            await workspace.save();
          }
          break;
        case TemplateType.PUSH:
          switch (step.metadata.selectedPlatform) {
            case 'All':
              await this.webhooksService.insertMessageStatusToClickhouse(
                await sender.process({
                  name: 'android',
                  accountID: owner.id,
                  stepID: step.id,
                  customerID: customer._id,
                  firebaseCredentials:
                    workspace.pushPlatforms.Android.credentials,
                  deviceToken: customer.androidDeviceToken,
                  pushTitle: template.pushObject.settings.Android.title,
                  pushText: template.pushObject.settings.Android.description,
                  trackingEmail: email,
                  filteredTags: filteredTags,
                  templateID: template.id,
                }),
                session
              );
              await this.webhooksService.insertMessageStatusToClickhouse(
                await sender.process({
                  name: 'ios',
                  accountID: owner.id,
                  stepID: step.id,
                  customerID: customer._id,
                  firebaseCredentials: workspace.pushPlatforms.iOS.credentials,
                  deviceToken: customer.iosDeviceToken,
                  pushTitle: template.pushObject.settings.iOS.title,
                  pushText: template.pushObject.settings.iOS.description,
                  trackingEmail: email,
                  filteredTags: filteredTags,
                  templateID: template.id,
                }),
                session
              );
              break;
            case 'iOS':
              await this.webhooksService.insertMessageStatusToClickhouse(
                await sender.process({
                  name: 'ios',
                  accountID: owner.id,
                  stepID: step.id,
                  customerID: customer._id,
                  firebaseCredentials: workspace.pushPlatforms.iOS.credentials,
                  deviceToken: customer.iosDeviceToken,
                  pushTitle: template.pushObject.settings.iOS.title,
                  pushText: template.pushObject.settings.iOS.description,
                  trackingEmail: email,
                  filteredTags: filteredTags,
                  templateID: template.id,
                }),
                session
              );
              break;
            case 'Android':
              await this.webhooksService.insertMessageStatusToClickhouse(
                await sender.process({
                  name: 'android',
                  accountID: owner.id,
                  stepID: step.id,
                  customerID: customer._id,
                  firebaseCredentials:
                    workspace.pushPlatforms.Android.credentials,
                  deviceToken: customer.androidDeviceToken,
                  pushTitle: template.pushObject.settings.Android.title,
                  pushText: template.pushObject.settings.Android.description,
                  trackingEmail: email,
                  filteredTags: filteredTags,
                  templateID: template.id,
                }),
                session
              );
              break;
          }
          break;
        case TemplateType.MODAL:
          if (template.modalState) {
            const isSent = await this.websocketGateway.sendModal(
              customer._id,
              template
            );
            if (!isSent)
              await this.modalsService.queueModalEvent(customer._id, template);
          }
          break;
        case TemplateType.SLACK:
          const installation = await this.slackService.getInstallation(
            customer
          );
          await this.webhooksService.insertMessageStatusToClickhouse(
            await sender.process({
              name: TemplateType.SLACK,
              accountID: owner.id,
              stepID: step.id,
              customerID: customer._id,
              templateID: template.id,
              methodName: 'chat.postMessage',
              filteredTags: filteredTags,
              args: {
                token: installation.installation.bot.token,
                channel: customer.slackId,
                text: await this.templatesService.parseApiCallTags(
                  template.slackMessage,
                  filteredTags
                ),
              },
            }),
            session
          );
          break;
        case TemplateType.SMS:
          await this.webhooksService.insertMessageStatusToClickhouse(
            await sender.process({
              name: TemplateType.SMS,
              accountID: owner.id,
              stepID: step.id,
              customerID: customer._id,
              templateID: template.id,
              from: workspace.smsFrom,
              sid: workspace.smsAccountSid,
              tags: filteredTags,
              text: await this.templatesService.parseApiCallTags(
                template.smsText,
                filteredTags
              ),
              to: customer.phPhoneNumber || customer.phone,
              token: workspace.smsAuthToken,
              trackingEmail: email,
            }),
            session
          );
          break;
        case TemplateType.WEBHOOK: //TODO:remove this from queue
          if (template.webhookData) {
            await this.webhooksQueue.add('whapicall', {
              template,
              filteredTags,
              audienceId: step.id,
              customerId: customer._id,
              accountId: owner.id,
            });
          }
          break;
      }

      // After send, update rate limit stuff
      // await this.journeyLocationsService.setMessageSent(location);
      location = { ...location, messageSent: true };
      await this.journeysService.rateLimitByMinuteIncrement(owner, journey);
    } else if (messageSendType === 'QUIET_ABORT') {
      this.phClient.capture({
        distinctId: owner.email,
        event: 'message_aborted',
        properties: {
          now: Date.now(),
          step,
          customer,
          workspace,
          journey,
          location,
          owner,
        },
      });
      // Record that the message was aborted
      await this.webhooksService.insertMessageStatusToClickhouse(
        [
          {
            stepId: step.id,
            createdAt: new Date().toISOString(),
            customerId: customer._id,
            event: 'aborted',
            eventProvider: ClickHouseEventProvider.TRACKER,
            messageId: step.metadata.humanReadableName,
            templateId: step.metadata.template,
            workspaceId: workspace.id,
            processed: true,
          },
        ],
        session
      );
    } else if (messageSendType === 'MOCK_SEND') {
      this.log(
        `MOCK_MESSAGE_SEND set to true, mocking message send for customer: ${customer._id} in journey ${journey.id}`,
        this.handleMessage.name,
        session,
        owner.id
      );
      if (process.env.MOCK_MESSAGE_SEND_URL) {
        try {
          const MOCK_MESSAGE_SEND_URL = new URL(
            process.env.MOCK_MESSAGE_SEND_URL
          );
          if (MOCK_MESSAGE_SEND_URL.protocol === 'http:') {
            await http.get(MOCK_MESSAGE_SEND_URL);
          } else if (MOCK_MESSAGE_SEND_URL.protocol === 'https:') {
            await https.get(MOCK_MESSAGE_SEND_URL);
          }
        } catch {
          this.warn(
            `MOCK_MESSAGE_SEND_URL: ${process.env.MOCK_MESSAGE_SEND_URL} not valid http: or https: URL or error in mock send.`,
            this.handleMessage.name,
            session,
            owner.id
          );
        }
      }
      await this.webhooksService.insertMessageStatusToClickhouse(
        [
          {
            stepId: step.id,
            createdAt: new Date().toISOString(),
            customerId: customer._id,
            event: 'sent',
            eventProvider: ClickHouseEventProvider.TRACKER,
            messageId: step.metadata.humanReadableName,
            templateId: step.metadata.template,
            workspaceId: workspace.id,
            processed: true,
          },
        ],
        session
      );
      // After mock send, update rate limit stuff
      // await this.journeyLocationsService.setMessageSent(location);
      location = { ...location, messageSent: true };
      await this.journeysService.rateLimitByMinuteIncrement(owner, journey);
    } else if (messageSendType === 'LIMIT_HOLD') {
      this.log(
        `Unique customers messaged limit hit. Holding customer:${customer._id} at message step for journey: ${journey.id}`,
        this.handleMessage.name,
        session,
        owner.id
      );
      await this.journeyLocationsService.unlock(location, step);
      return;
    } else if (
      messageSendType === 'QUIET_REQUEUE' ||
      messageSendType === 'LIMIT_REQUEUE'
    ) {
      this.log(
        `Requeuing message for customer: ${customer._id}, step: ${step.id} for reason: ${messageSendType}`,
        this.handleMessage.name,
        session,
        owner.id
      );
      await this.stepsService.requeueMessage(
        owner,
        step,
        customer._id,
        requeueTime,
        session
      );
      await this.journeyLocationsService.unlock(location, step);
      return;
    }

    let nextStep: Step = await this.cacheManager.get(
      `step:${step.metadata.destination}`
    );
    if (!nextStep) {
      nextStep = await this.stepsService.lazyFindByID(
        step.metadata.destination
      );
      await this.cacheManager.set(
        `step:${step.metadata.destination}`,
        nextStep
      );
    }

    if (nextStep) {
      if (
        nextStep.type !== StepType.TIME_DELAY &&
        nextStep.type !== StepType.TIME_WINDOW &&
        nextStep.type !== StepType.WAIT_UNTIL_BRANCH
      ) {
        job = {
          owner,
          journey,
          step: nextStep,
          session,
          customer,
          location,
          event,
        };
      } else {
        // Destination is time based,
        // customer has stopped moving so we can release lock
        await this.journeyLocationsService.unlock(location, nextStep);
      }
    } else {
      // Destination does not exist,
      // customer has stopped moving so we can release lock
      await this.journeyLocationsService.unlock(location, step);
    }
    if (nextStep && job) await this.transitionQueue.add(nextStep.type, job);
  }

  /**
   * Handle start step type; move all customers to next step and update
   * their step entry timestamps, then add next job to queue if following
   * step is not time based.
   * @param stepID
   * @param accountID
   * @param session
   * @param queryRunner
   * @param transactionSession
   */
  async handleStart(
    owner: Account,
    journey: Journey,
    step: Step,
    session: string,
    customer: CustomerDocument,
    location: JourneyLocation,
    event?: string
  ) {
    let job;
    let nextStep: Step = await this.cacheManager.get(
      `step:${step.metadata.destination}`
    );
    if (!nextStep) {
      nextStep = await this.stepsService.lazyFindByID(
        step.metadata.destination
      );
      await this.cacheManager.set(
        `step:${step.metadata.destination}`,
        nextStep
      );
    }

    if (nextStep) {
      if (
        nextStep.type !== StepType.TIME_DELAY &&
        nextStep.type !== StepType.TIME_WINDOW &&
        nextStep.type !== StepType.WAIT_UNTIL_BRANCH
      ) {
        job = {
          owner,
          journey,
          step: nextStep,
          session,
          customer,
          location,
          event,
        };
      } else {
        // Destination is time based,
        // customer has stopped moving so we can release lock
        await this.journeyLocationsService.unlock(location, nextStep);
      }
    } else {
      // Destination does not exist,
      // customer has stopped moving so we can release lock
      await this.journeyLocationsService.unlock(location, step);
    }
    if (nextStep && job) await this.transitionQueue.add(nextStep.type, job);
  }

  /**
   * Handle exit step type; move all customers to next step and update
   * their step entry timestamps, then add next job to queue if following
   * step is not time based.
   * @param stepID
   * @param accountID
   * @param session
   * @param queryRunner
   * @param transactionSession
   */
  async handleExit(
    owner: Account,
    journey: Journey,
    step: Step,
    session: string,
    customer: CustomerDocument,
    location: JourneyLocation
  ) {
    await this.journeyLocationsService.unlock(location, step);
  }

  /**
   * Handle time delay step; move all customers that have been in that step longer than the delay
   * @param stepID
   * @param accountID
   * @param session
   * @param queryRunner
   * @param transactionSession
   */
  async handleTimeDelay(
    owner: Account,
    journey: Journey,
    step: Step,
    session: string,
    customer: CustomerDocument,
    location: JourneyLocation,
    event?: string
  ) {
    let job, nextStep;
    if (
      Date.now() - location.stepEntry >
      Temporal.Duration.from(step.metadata.delay).total({
        unit: 'millisecond',
      })
    ) {
      nextStep = await this.cacheManager.get(
        `step:${step.metadata.destination}`
      );
      if (!nextStep) {
        nextStep = await this.stepsService.lazyFindByID(
          step.metadata.destination
        );
        await this.cacheManager.set(
          `step:${step.metadata.destination}`,
          nextStep
        );
      }
      if (nextStep) {
        if (
          nextStep.type !== StepType.TIME_DELAY &&
          nextStep.type !== StepType.TIME_WINDOW &&
          nextStep.type !== StepType.WAIT_UNTIL_BRANCH
        ) {
          job = {
            owner,
            journey,
            step: nextStep,
            session,
            customer,
            location,
            event,
          };
        } else {
          // Destination is time based,
          // customer has stopped moving so we can release lock
          await this.journeyLocationsService.unlock(location, nextStep);
        }
      } else {
        // Destination does not exist,
        // customer has stopped moving so we can release lock
        await this.journeyLocationsService.unlock(location, step);
      }
    } else {
      // Not yet time to move customer,
      // customer has stopped moving so we can release lock
      await this.journeyLocationsService.unlock(location, step);
    }
    if (nextStep && job) await this.transitionQueue.add(nextStep.type, job);
  }

  /**
   *
   * @param stepID
   * @param accountID
   * @param session
   * @param queryRunner
   * @param transactionSession
   */
  async handleTimeWindow(
    owner: Account,
    journey: Journey,
    step: Step,
    session: string,
    customer: CustomerDocument,
    location: JourneyLocation,
    event?: string
  ) {
    let job, nextStep;
    let moveCustomer = false;

    // Case 1: Specific days of the week
    if (step.metadata.window.onDays) {
      const now = new Date();

      const startTime = new Date(now.getTime());
      startTime.setHours(step.metadata.window.fromTime.split(':')[0]);
      startTime.setMinutes(step.metadata.window.fromTime.split(':')[1]);

      const endTime = new Date(now.getTime());
      endTime.setHours(step.metadata.window.toTime.split(':')[0]);
      endTime.setMinutes(step.metadata.window.toTime.split(':')[1]);

      const day = now.getDay();

      if (
        startTime < now &&
        endTime > now &&
        step.metadata.window.onDays[day] === 1
      ) {
        moveCustomer = true;
      }
    }
    // Case2: Date and time of window
    else {
      if (
        new Date(
          Temporal.Instant.from(step.metadata.window.from).epochMilliseconds
        ).getTime() < Date.now() &&
        Date.now() <
          new Date(
            Temporal.Instant.from(step.metadata.window.to).epochMilliseconds
          ).getTime()
      ) {
        moveCustomer = true;
      }
    }
    if (moveCustomer) {
      nextStep = await this.cacheManager.get(
        `step:${step.metadata.destination}`
      );
      if (!nextStep) {
        nextStep = await this.stepsService.lazyFindByID(
          step.metadata.destination
        );
        await this.cacheManager.set(
          `step:${step.metadata.destination}`,
          nextStep
        );
      }
      if (nextStep) {
        if (
          nextStep.type !== StepType.TIME_DELAY &&
          nextStep.type !== StepType.TIME_WINDOW &&
          nextStep.type !== StepType.WAIT_UNTIL_BRANCH
        ) {
          job = {
            owner,
            journey,
            step: nextStep,
            session,
            customer,
            location,
            event,
          };
        } else {
          // Destination is time based,
          // customer has stopped moving so we can release lock
          await this.journeyLocationsService.unlock(location, nextStep);
        }
      } else {
        // Destination does not exist,
        // customer has stopped moving so we can release lock
        await this.journeyLocationsService.unlock(location, step);
      }
    } else {
      // Not yet time to move customer,
      // customer has stopped moving so we can release lock
      await this.journeyLocationsService.unlock(location, step);
    }
    if (nextStep && job) {
      await this.transitionQueue.add(nextStep.type, job);
    }
  }

  /**
   *
   * @param stepID
   * @param session
   * @param customerID
   * @param branch
   * @param queryRunner
   * @param transactionSession
   */
  async handleWaitUntil(
    owner: Account,
    journey: Journey,
    step: Step,
    session: string,
    customer: CustomerDocument,
    location: JourneyLocation,
    event?: string,
    branch?: number
  ) {
    let job;
    let nextStep: Step,
      moveCustomer = false;

    // Time branch case
    if (branch < 0 && step.metadata.timeBranch) {
      if (step.metadata.timeBranch.delay) {
        if (
          Date.now() - location.stepEntry >
          Temporal.Duration.from(step.metadata.timeBranch.delay).total({
            unit: 'millisecond',
          })
        ) {
          moveCustomer = true;
        }
      } else if (step.metadata.timeBranch.window) {
        if (step.metadata.timeBranch.window.onDays) {
          const now = new Date();

          const startTime = new Date(now.getTime());
          startTime.setHours(
            step.metadata.timeBranch.window.fromTime.split(':')[0]
          );
          startTime.setMinutes(
            step.metadata.timeBranch.window.fromTime.split(':')[1]
          );

          const endTime = new Date(now.getTime());
          endTime.setHours(
            step.metadata.timeBranch.window.toTime.split(':')[0]
          );
          endTime.setMinutes(
            step.metadata.timeBranch.window.toTime.split(':')[1]
          );

          const day = now.getDay();

          this.warn(
            JSON.stringify({ day, startTime, endTime, now, step }),
            this.handleTimeWindow.name,
            session,
            owner.email
          );

          if (
            startTime < now &&
            endTime > now &&
            step.metadata.timeBranch.window.onDays[day] === 1
          ) {
            moveCustomer = true;
          }
        }
        // Case2: Date and time of window
        else {
          if (
            new Date(
              Temporal.Instant.from(
                step.metadata.timeBranch.window.from
              ).epochMilliseconds
            ).getTime() < Date.now() &&
            Date.now() <
              new Date(
                Temporal.Instant.from(
                  step.metadata.timeBranch.window.to
                ).epochMilliseconds
              ).getTime()
          ) {
            this.warn(
              JSON.stringify({
                warning: `${step.metadata.timeBranch.window}`,
              }),
              this.handleTimeWindow.name,
              session,
              owner.email
            );

            moveCustomer = true;
          }
        }
      }
      if (moveCustomer) {
        nextStep = await this.cacheManager.get(
          `step:${step.metadata.timeBranch?.destination}`
        );
        if (!nextStep) {
          nextStep = await this.stepsService.lazyFindByID(
            step.metadata.timeBranch?.destination
          );
          await this.cacheManager.set(
            `step:${step.metadata.timeBranch?.destination}`,
            nextStep
          );
        }
        if (nextStep) {
          if (
            nextStep.type !== StepType.TIME_DELAY &&
            nextStep.type !== StepType.TIME_WINDOW &&
            nextStep.type !== StepType.WAIT_UNTIL_BRANCH
          ) {
            job = {
              owner,
              journey,
              step: nextStep,
              session,
              customer,
              location,
              event,
            };
          } else {
            // Destination is time based,
            // customer has stopped moving so we can release lock
            await this.journeyLocationsService.unlock(location, nextStep);
          }
        } else {
          // Destination does not exist,
          // customer has stopped moving so we can release lock
          await this.journeyLocationsService.unlock(location, step);
        }
      } else {
        // Not yet time to move customer,
        // customer has stopped moving so we can release lock
        await this.journeyLocationsService.unlock(location, step);
      }
    } else if (branch > -1 && step.metadata.branches.length > 0) {
      nextStep = await this.cacheManager.get(
        `step:${
          step.metadata.branches.filter((branchItem) => {
            return branchItem.index === branch;
          })[0].destination
        }`
      );
      if (!nextStep) {
        nextStep = await this.stepsService.lazyFindByID(
          step.metadata.branches.filter((branchItem) => {
            return branchItem.index === branch;
          })[0].destination
        );
        await this.cacheManager.set(
          `step:${
            step.metadata.branches.filter((branchItem) => {
              return branchItem.index === branch;
            })[0].destination
          }`,
          nextStep
        );
      }
      if (nextStep) {
        if (
          nextStep.type !== StepType.TIME_DELAY &&
          nextStep.type !== StepType.TIME_WINDOW &&
          nextStep.type !== StepType.WAIT_UNTIL_BRANCH
        ) {
          job = {
            owner,
            journey,
            step: nextStep,
            session,
            customer,
            location,
            event,
          };
        } else {
          // Destination is time based,
          // customer has stopped moving so we can release lock
          await this.journeyLocationsService.unlock(location, nextStep);
        }
      } else {
        // Destination does not exist,
        // customer has stopped moving so we can release lock
        await this.journeyLocationsService.unlock(location, step);
      }
    } else {
      await this.journeyLocationsService.unlock(location, step);
    }
    if (nextStep && job) await this.transitionQueue.add(nextStep.type, job);
  }

  /**
   * Handle multisplit step
   *
   * @param {String} ownerID
   * @param {String} journeyID
   * @param {String} stepID
   * @param {String} session
   * @param {String} customerID
   * @param {QueryRunner} queryRunner
   * @param {ClientSession} transactionSession
   * @param {String} event
   */
  async handleMultisplit(
    owner: Account,
    journey: Journey,
    step: Step,
    session: string,
    customer: CustomerDocument,
    location: JourneyLocation,
    event?: string
  ) {
    let job;
    let nextStep: Step,
      nextStepId: string,
      matches = false;

    for (
      let branchIndex = 0;
      branchIndex < step.metadata.branches.length;
      branchIndex++
    ) {
      if (
        await this.customersService.checkCustomerMatchesQuery(
          step.metadata.branches[branchIndex].conditions.query,
          owner,
          session,
          customer
        )
      ) {
        matches = true;
        nextStepId = step.metadata.branches[branchIndex].destination;
        break;
      }
    }
    if (!matches) nextStepId = step.metadata.allOthers;

    nextStep = await this.cacheManager.get(`step:${nextStepId}`);
    if (!nextStep) {
      nextStep = await this.stepsService.lazyFindByID(nextStepId);
      await this.cacheManager.set(`step:${nextStepId}`, nextStep);
    }

    if (nextStep) {
      if (
        nextStep.type !== StepType.TIME_DELAY &&
        nextStep.type !== StepType.TIME_WINDOW &&
        nextStep.type !== StepType.WAIT_UNTIL_BRANCH
      ) {
        job = {
          owner,
          journey,
          step: nextStep,
          session,
          customer,
          location,
          event,
        };
      } else {
        // Destination is time based,
        // customer has stopped moving so we can release lock
        await this.journeyLocationsService.unlock(location, nextStep);
      }
    } else {
      // Destination does not exist,
      // customer has stopped moving so we can release lock
      await this.journeyLocationsService.unlock(location, step);
    }
    if (nextStep && job) await this.transitionQueue.add(nextStep.type, job);
  }

  /**
   *
   * @param stepID
   * @param session
   * @param queryRunner
   * @param transactionSession
   */
  async handleLoop(
    owner: Account,
    journey: Journey,
    step: Step,
    session: string,
    customer: CustomerDocument,
    location: JourneyLocation,
    event?: string
  ) {
    let job;
    let nextStep: Step = await this.cacheManager.get(
      `step:${step.metadata.destination}`
    );
    if (!nextStep) {
      nextStep = await this.stepsService.lazyFindByID(
        step.metadata.destination
      );
      await this.cacheManager.set(
        `step:${step.metadata.destination}`,
        nextStep
      );
    }

    if (nextStep) {
      if (
        nextStep.type !== StepType.TIME_DELAY &&
        nextStep.type !== StepType.TIME_WINDOW &&
        nextStep.type !== StepType.WAIT_UNTIL_BRANCH
      ) {
        job = {
          owner,
          journey,
          step: nextStep,
          session,
          customer,
          location,
          event,
        };
      } else {
        // Destination is time based,
        // customer has stopped moving so we can release lock
        await this.journeyLocationsService.unlock(location, nextStep);
      }
    } else {
      // Destination does not exist,
      // customer has stopped moving so we can release lock
      await this.journeyLocationsService.unlock(location, step);
    }
    if (nextStep && job) await this.transitionQueue.add(nextStep.type, job);
  }

  async handleExperiment(
    owner: Account,
    journey: Journey,
    step: Step,
    session: string,
    customer: CustomerDocument,
    location: JourneyLocation,
    event?: string
  ) {
    let p = 0;
    let job;
    let nextStep;
    let nextBranch: ExperimentBranch | undefined;

    const random = Math.random();
    for (const branch of step.metadata.branches) {
      p += branch.ratio;
      if (random < p) {
        nextBranch = branch;
        break;
      }
    }

    nextStep = await this.cacheManager.get(`step:${nextBranch.destination}`);
    if (!nextStep) {
      nextStep = await this.stepsService.lazyFindByID(nextBranch.destination);
      if (nextStep)
        await this.cacheManager.set(`step:${nextBranch.destination}`, nextStep);
    }

    if (nextStep) {
      if (
        nextStep.type !== StepType.TIME_DELAY &&
        nextStep.type !== StepType.TIME_WINDOW &&
        nextStep.type !== StepType.WAIT_UNTIL_BRANCH
      ) {
        job = {
          owner,
          journey,
          step: nextStep,
          session,
          location,
          customer,
          event,
        };
      } else {
        // Destination is time based,
        // customer has stopped moving so we can release lock
        await this.journeyLocationsService.unlock(location, nextStep);
      }
    } else {
      // Destination does not exist,
      // customer has stopped moving so we can release lock
      await this.journeyLocationsService.unlock(location, step);
    }
    if (nextStep && job) await this.transitionQueue.add(nextStep.type, job);
  }

  // TODO
  async handleABTest(job: Job<any, any, string>) {}
  async handleRandomCohortBranch(job: Job<any, any, string>) {}

  // @OnWorkerEvent('active')
  // onActive(job: Job<any, any, any>, prev: string) {
  //   this.debug(
  //     `${JSON.stringify({ job: job })}`,
  //     this.onActive.name,
  //     job.data.session,
  //     job.data.userID
  //   );
  // }

  // @OnWorkerEvent('closed')
  // onClosed() {
  //   this.debug(`${JSON.stringify({})}`, this.onClosed.name, '');
  // }

  // @OnWorkerEvent('closing')
  // onClosing(msg: string) {
  //   this.debug(`${JSON.stringify({ message: msg })}`, this.onClosing.name, '');
  // }

  // @OnWorkerEvent('completed')
  // onCompleted(job: Job<any, any, any>, result: any, prev: string) {
  //   this.debug(
  //     `${JSON.stringify({ job: job, result: result })}`,
  //     this.onProgress.name,
  //     job.data.session,
  //     job.data.userID
  //   );
  // }

  // @OnWorkerEvent('drained')
  // onDrained() {
  //   this.debug(`${JSON.stringify({})}`, this.onDrained.name, '');
  // }

  // @OnWorkerEvent('error')
  // onError(failedReason: Error) {
  //   this.error(failedReason, this.onError.name, '');
  // }

  // @OnWorkerEvent('failed')
  // onFailed(job: Job<any, any, any> | undefined, error: Error, prev: string) {
  //   this.error(error, this.onFailed.name, job.data.session);
  // }

  // @OnWorkerEvent('paused')
  // onPaused() {
  //   this.debug(`${JSON.stringify({})}`, this.onPaused.name, '');
  // }

  // @OnWorkerEvent('progress')
  // onProgress(job: Job<any, any, any>, progress: number | object) {
  //   this.debug(
  //     `${JSON.stringify({ job: job, progress: progress })}`,
  //     this.onProgress.name,
  //     job.data.session,
  //     job.data.userID
  //   );
  // }

  // @OnWorkerEvent('ready')
  // onReady() {
  //   this.debug(`${JSON.stringify({})}`, this.onReady.name, '');
  // }

  // @OnWorkerEvent('resumed')
  // onResumed() {
  //   this.debug(`${JSON.stringify({})}`, this.onResumed.name, '');
  // }

  // @OnWorkerEvent('stalled')
  // onStalled(jobId: string, prev: string) {
  //   this.debug(
  //     `${JSON.stringify({ id: jobId, prev: prev })}`,
  //     this.onStalled.name,
  //     jobId
  //   );
  // }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error, prev?: string) {
    Sentry.withScope((scope) => {
      scope.setTag('job_id', job.id);
      scope.setTag('processor', TransitionProcessor.name);
      Sentry.captureException(error);
    });
  }
}
