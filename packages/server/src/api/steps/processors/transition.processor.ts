/* eslint-disable no-case-declarations */
import { HttpException, HttpStatus, Inject, Logger } from '@nestjs/common';
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
import { Job, Queue } from 'bullmq';
import { cpus } from 'os';
import { CustomComponentAction, StepType } from '../types/step.interface';
import { Step } from '../entities/step.entity';
import { DataSource, QueryRunner } from 'typeorm';
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
import { TemplateType } from '@/api/templates/entities/template.entity';
import { WebsocketGateway } from '@/websockets/websocket.gateway';
import { ModalsService } from '@/api/modals/modals.service';
import { SlackService } from '@/api/slack/slack.service';
import { Account } from '@/api/accounts/entities/accounts.entity';
import { RedlockService } from '@/api/redlock/redlock.service';
import * as _ from 'lodash';
import { Lock } from 'redlock';
import { PostHog } from 'posthog-node';
import * as Sentry from '@sentry/node';
import { interval } from 'rxjs';
import { convertTimeToUTC, isWithinInterval } from '@/common/helper/timing';
import { JourneySettingsQuiteFallbackBehavior } from '@/api/journeys/types/additional-journey-settings.interface';
import { StepsService } from '../steps.service';
import { Journey } from '@/api/journeys/entities/journey.entity';

@Injectable()
@Processor('transition', { concurrency: cpus().length })
export class TransitionProcessor extends WorkerHost {
  private phClient = new PostHog(process.env.POSTHOG_KEY, {
    host: process.env.POSTHOG_HOST,
  });

  constructor(
    private dataSource: DataSource,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @InjectQueue('transition') private readonly transitionQueue: Queue,
    @InjectQueue('webhooks') private readonly webhooksQueue: Queue,
    @InjectConnection() private readonly connection: mongoose.Connection,
    @Inject(WebhooksService) private readonly webhooksService: WebhooksService,
    @Inject(CustomersService)
    private readonly customersService: CustomersService,
    @Inject(TemplatesService)
    private readonly templatesService: TemplatesService,
    @Inject(WebsocketGateway)
    private websocketGateway: WebsocketGateway,
    @Inject(ModalsService) private modalsService: ModalsService,
    @Inject(SlackService) private slackService: SlackService,
    @InjectModel(Customer.name) public customerModel: Model<CustomerDocument>,
    @Inject(RedlockService) private redlockService: RedlockService,
    @Inject(StepsService) private stepsService: StepsService
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

  async process(job: Job<any, any, string>): Promise<any> {
    this.debug(
      `${JSON.stringify({ job })}`,
      this.process.name,
      randomUUID(),
      ''
    );
    let err: any;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const transactionSession = await this.connection.startSession();
    await transactionSession.startTransaction();
    try {
      switch (job.data.step.type) {
        case StepType.AB_TEST:
          break;
        case StepType.ATTRIBUTE_BRANCH:
          this.handleAttributeBranch(
            job.data.ownerID,
            job.data.step.id,
            job.data.session,
            job.data.customerID,
            this.redlockService.retrieve(
              job.data.lock.resources,
              job.data.lock.value,
              job.data.lock.attempts,
              job.data.lock.expiration
            ),
            queryRunner,
            transactionSession,
            job.data.event
          );
          break;
        case StepType.EXIT:
          const lock = this.redlockService.retrieve(
            job.data.lock.resources,
            job.data.lock.value,
            job.data.lock.attempts,
            job.data.lock.expiration
          );
          await lock.release();
          this.warn(
            `${JSON.stringify({ warning: 'Releasing lock' })}`,
            this.process.name,
            job.data.session
          );
          break;
        case StepType.LOOP:
          await this.handleLoop(
            job.data.ownerID,
            job.data.step.id,
            job.data.session,
            job.data.customerID,
            this.redlockService.retrieve(
              job.data.lock.resources,
              job.data.lock.value,
              job.data.lock.attempts,
              job.data.lock.expiration
            ),
            queryRunner,
            transactionSession,
            job.data.event
          );
          break;
        case StepType.MESSAGE:
          await this.handleMessage(
            job.data.ownerID,
            job.data.step.id,
            job.data.session,
            job.data.customerID,
            this.redlockService.retrieve(
              job.data.lock.resources,
              job.data.lock.value,
              job.data.lock.attempts,
              job.data.lock.expiration
            ),
            queryRunner,
            transactionSession,
            job.data.event
          );
          break;
        case StepType.TRACKER:
          await this.handleCustomComponent(
            job.data.ownerID,
            job.data.step.id,
            job.data.session,
            job.data.customerID,
            this.redlockService.retrieve(
              job.data.lock.resources,
              job.data.lock.value,
              job.data.lock.attempts,
              job.data.lock.expiration
            ),
            queryRunner,
            transactionSession,
            job.data.event
          );
          break;
        case StepType.RANDOM_COHORT_BRANCH:
          break;
        case StepType.START:
          await this.handleStart(
            job.data.ownerID,
            job.data.step.id,
            job.data.session,
            job.data.customerID,
            this.redlockService.retrieve(
              job.data.lock.resources,
              job.data.lock.value,
              job.data.lock.attempts,
              job.data.lock.expiration
            ),
            queryRunner,
            transactionSession,
            job.data.event
          );
          break;
        case StepType.TIME_DELAY:
          await this.handleTimeDelay(
            job.data.ownerID,
            job.data.step.id,
            job.data.session,
            job.data.customerID,
            this.redlockService.retrieve(
              job.data.lock.resources,
              job.data.lock.value,
              job.data.lock.attempts,
              job.data.lock.expiration
            ),
            queryRunner,
            transactionSession,
            job.data.event
          );
          break;
        case StepType.TIME_WINDOW:
          await this.handleTimeWindow(
            job.data.ownerID,
            job.data.step.id,
            job.data.session,
            job.data.customerID,
            this.redlockService.retrieve(
              job.data.lock.resources,
              job.data.lock.value,
              job.data.lock.attempts,
              job.data.lock.expiration
            ),
            queryRunner,
            transactionSession,
            job.data.event
          );
          break;
        case StepType.WAIT_UNTIL_BRANCH:
          await this.handleWaitUntil(
            job.data.ownerID,
            job.data.step.id,
            job.data.session,
            job.data.customerID,
            this.redlockService.retrieve(
              job.data.lock.resources,
              job.data.lock.value,
              job.data.lock.attempts,
              job.data.lock.expiration
            ),
            job.data.branch,
            queryRunner,
            transactionSession,
            job.data.event
          );
          break;
        default:
          break;
      }
      await transactionSession.commitTransaction();
      await queryRunner.commitTransaction();
    } catch (e) {
      await transactionSession.abortTransaction();
      await queryRunner.rollbackTransaction();
      this.error(e, this.process.name, job.data.session);
      err = e;
      const lock = this.redlockService.retrieve(
        job.data.lock.resources,
        job.data.lock.value,
        job.data.lock.attempts,
        job.data.lock.expiration
      );
      await lock.release();
      this.warn(
        `${JSON.stringify({ warning: 'Releasing lock' })}`,
        this.process.name,
        job.data.session
      );
    } finally {
      await transactionSession.endSession();
      await queryRunner.release();
      if (err) throw err;
    }
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
    lock: Lock,
    queryRunner: QueryRunner,
    transactionSession: mongoose.mongo.ClientSession,
    event?: string
  ) {
    /**
     * Boilerplate Step One Start
     */
    const owner = await queryRunner.manager.findOne(Account, {
      where: { id: ownerID },
    });

    const currentStep = await queryRunner.manager.findOne(Step, {
      where: {
        id: stepID,
        type: StepType.TRACKER,
      },
      lock: { mode: 'pessimistic_write' },
    });

    if (
      !_.find(currentStep.customers, (customer) => {
        return JSON.parse(customer).customerID === customerID;
      })
    ) {
      await lock.release();
      this.warn(
        `${JSON.stringify({ warning: 'Releasing lock' })}`,
        this.handleCustomComponent.name,
        session,
        owner.email
      );
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
      lock: { mode: 'pessimistic_write' },
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

    const customer: CustomerDocument = await this.customersService.findById(
      owner,
      customerID
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
    await this.webhooksService.insertMessageStatusToClickhouse([
      {
        stepId: stepID,
        createdAt: new Date().toISOString(),
        customerId: customerID,
        event: 'sent',
        eventProvider: ClickHouseEventProvider.TRACKER,
        messageId: humanReadableName,
        templateId: String(templateID),
        userId: owner.id,
        processed: true,
      },
    ]);

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
      await this.webhooksService.insertMessageStatusToClickhouse([
        {
          stepId: stepID,
          createdAt: new Date().toISOString(),
          customerId: customerID,
          event: 'delivered',
          eventProvider: ClickHouseEventProvider.TRACKER,
          messageId: humanReadableName,
          templateId: String(templateID),
          userId: owner.id,
          processed: true,
        },
      ]);

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
          lock,
          event,
        });
      else {
        await lock.release();
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
      await lock.release();
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
    ownerID: string,
    stepID: string,
    session: string,
    customerID: string,
    lock: Lock,
    queryRunner: QueryRunner,
    transactionSession: mongoose.mongo.ClientSession,
    event?: string
  ) {
    const owner = await queryRunner.manager.findOne(Account, {
      where: { id: ownerID },
    });

    const currentStep = await queryRunner.manager.findOne(Step, {
      where: {
        id: stepID,
        type: StepType.MESSAGE,
      },
      loadRelationIds: true,
      lock: { mode: 'pessimistic_write' },
    });

    const journey = await queryRunner.manager.findOne(Journey, {
      where: {
        id: currentStep.journey as unknown as string, // casting to string because loadRelationIds,
      },
    });

    // Rate limiting and sending quiet hours will be stored here
    let messageSendType: 'SEND' | 'QUIET_REQUEUE' | 'QUIET_ABORT' = 'SEND';
    let requeueTime: Date;
    if (
      journey.journeySettings &&
      journey.journeySettings.quiteHours &&
      journey.journeySettings.quiteHours.enabled
    ) {
      let quietHours = journey.journeySettings.quiteHours!;
      // CHECK IF SENDING QUIET HOURS
      let formatter = Intl.DateTimeFormat(undefined, {
        hour: '2-digit',
        minute: '2-digit',
        hourCycle: 'h24',
        timeZone: 'UTC',
      });
      let now = new Date();
      let utcNowString = formatter.format(now);
      let utcStartTime = convertTimeToUTC(
        quietHours.startTime,
        owner.timezoneUTCOffset
      );
      let utcEndTime = convertTimeToUTC(
        quietHours.endTime,
        owner.timezoneUTCOffset
      );
      let isQuietHour = isWithinInterval(
        utcStartTime,
        utcEndTime,
        utcNowString
      );

      if (isQuietHour) {
        switch (quietHours.fallbackBehavior) {
          case JourneySettingsQuiteFallbackBehavior.NextAvailableTime:
            messageSendType = 'QUIET_REQUEUE';
            break;
          case JourneySettingsQuiteFallbackBehavior.Abort:
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
          `Observing quiet hours, now ${now}, quietHours: ${quietHours.startTime}-${quietHours.endTime}, account UTC offset: ${owner.timezoneUTCOffset}, type ${messageSendType}`,
          this.handleMessage.name,
          session,
          owner.email
        );
      }
    }

    if (
      !_.find(currentStep.customers, (customer) => {
        return JSON.parse(customer).customerID === customerID;
      })
    ) {
      await lock.release();
      this.warn(
        `${JSON.stringify({ warning: 'Releasing lock' })}`,
        this.handleMessage.name,
        session,
        owner.email
      );
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
      lock: { mode: 'pessimistic_write' },
    });

    if (messageSendType === 'SEND') {
      //send message here
      const templateID = currentStep.metadata.template;
      const template = await this.templatesService.transactionalFindOneById(
        owner,
        templateID.toString(),
        queryRunner
      );
      const {
        mailgunAPIKey,
        sendingName,
        testSendingEmail,
        testSendingName,
        sendgridApiKey,
        sendgridFromEmail,
        email,
      } = owner;
      let { sendingDomain, sendingEmail } = owner;

      let key = mailgunAPIKey;
      let from = sendingName;
      const customer: CustomerDocument = await this.customersService.findById(
        owner,
        customerID
      );
      const { _id, ownerId, workflows, journeys, ...tags } =
        customer.toObject();
      const filteredTags = cleanTagsForSending(tags);
      const sender = new MessageSender();

      switch (template.type) {
        case TemplateType.EMAIL:
          if (owner.emailProvider === 'free3') {
            if (owner.freeEmailsCount === 0)
              throw new HttpException(
                'You exceeded limit of 3 emails',
                HttpStatus.PAYMENT_REQUIRED
              );
            sendingDomain = process.env.MAILGUN_TEST_DOMAIN;
            key = process.env.MAILGUN_API_KEY;
            from = testSendingName;
            sendingEmail = testSendingEmail;
            owner.freeEmailsCount--;
          }
          if (owner.emailProvider === 'sendgrid') {
            key = sendgridApiKey;
            from = sendgridFromEmail;
          }
          const ret = await sender.process({
            name: TemplateType.EMAIL,
            accountID: owner.id,
            cc: template.cc,
            customerID: customerID,
            domain: sendingDomain,
            email: sendingEmail,
            stepID: currentStep.id,
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
            eventProvider: owner.emailProvider,
          });
          this.debug(
            `${JSON.stringify(ret)}`,
            this.handleMessage.name,
            session
          );
          await this.webhooksService.insertMessageStatusToClickhouse(ret);
          if (owner.emailProvider === 'free3') await owner.save();
          break;
        case TemplateType.PUSH:
          // TODO: update for new PUSH
          // await this.webhooksService.insertMessageStatusToClickhouse(
          //   await sender.process({
          //     name: TemplateType.PUSH,
          //     accountID: owner.id,
          //     stepID: currentStep.id,
          //     customerID: customerID,
          //     firebaseCredentials: owner.firebaseCredentials,
          //     phDeviceToken: customer.phDeviceToken,
          //     pushText: await this.templatesService.parseApiCallTags(
          //       template.pushText,
          //       filteredTags
          //     ),
          //     pushTitle: await this.templatesService.parseApiCallTags(
          //       template.pushTitle,
          //       filteredTags
          //     ),
          //     trackingEmail: email,
          //     filteredTags: filteredTags,
          //     templateID: template.id,
          //   })
          // );
          break;
        case TemplateType.MODAL:
          if (template.modalState) {
            const isSent = await this.websocketGateway.sendModal(
              customerID,
              template
            );
            if (!isSent)
              await this.modalsService.queueModalEvent(customerID, template);
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
              stepID: currentStep.id,
              customerID: customer.id,
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
            })
          );
          break;
        case TemplateType.SMS:
          await this.webhooksService.insertMessageStatusToClickhouse(
            await sender.process({
              name: TemplateType.SMS,
              accountID: owner.id,
              stepID: currentStep.id,
              customerID: customer.id,
              templateID: template.id,
              from: owner.smsFrom,
              sid: owner.smsAccountSid,
              tags: filteredTags,
              text: await this.templatesService.parseApiCallTags(
                template.smsText,
                filteredTags
              ),
              to: customer.phPhoneNumber || customer.phone,
              token: owner.smsAuthToken,
              trackingEmail: email,
            })
          );
          break;
        case TemplateType.WEBHOOK: //TODO:remove this from queue
          if (template.webhookData) {
            await this.webhooksQueue.add('whapicall', {
              template,
              filteredTags,
              audienceId: stepID,
              customerId: customerID,
              accountId: owner.id,
            });
          }
          break;
      }
    } else if (messageSendType === 'QUIET_ABORT') {
      // Record that the message was aborted
      await this.webhooksService.insertMessageStatusToClickhouse([
        {
          stepId: stepID,
          createdAt: new Date().toISOString(),
          customerId: customerID,
          event: 'aborted',
          eventProvider: ClickHouseEventProvider.TRACKER,
          messageId: currentStep.metadata.humanReadableName,
          templateId: currentStep.metadata.template,
          userId: owner.id,
          processed: true,
        },
      ]);
    } else if (messageSendType === 'QUIET_REQUEUE') {
      this.stepsService.requeueMessage(
        owner,
        currentStep,
        customerID,
        requeueTime,
        session,
        queryRunner
      );
      await lock.release();
      this.warn(
        `${JSON.stringify({ warning: 'Releasing lock' })}`,
        this.handleMessage.name,
        session,
        owner.email
      );
      return;
    }

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
          lock,
          event,
        });
      else {
        await lock.release();
        this.warn(
          `${JSON.stringify({ warning: 'Releasing lock' })}`,
          this.handleMessage.name,
          session,
          owner.email
        );
      }
    } else {
      // Destination does not exist, customer has stopped moving so
      // we can release lock
      await lock.release();
      this.warn(
        `${JSON.stringify({ warning: 'Releasing lock' })}`,
        this.handleMessage.name,
        session,
        owner.email
      );
    }
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
    ownerID: string,
    stepID: string,
    session: string,
    customerID: string,
    lock: Lock,
    queryRunner: QueryRunner,
    transactionSession: mongoose.mongo.ClientSession,
    event?: string
  ) {
    const owner = await queryRunner.manager.findOne(Account, {
      where: { id: ownerID },
    });

    const currentStep = await queryRunner.manager.findOne(Step, {
      where: {
        id: stepID,
        type: StepType.START,
      },
      lock: { mode: 'pessimistic_write' },
    });

    if (
      !_.find(currentStep.customers, (customer) => {
        return JSON.parse(customer).customerID === customerID;
      })
    ) {
      await lock.release();
      this.warn(
        `${JSON.stringify({ warning: 'Releasing lock' })}`,
        this.handleStart.name,
        session,
        owner.email
      );
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
      lock: { mode: 'pessimistic_write' },
    });

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
          lock,
          event,
        });
      else {
        await lock.release();
        this.warn(
          `${JSON.stringify({ warning: 'Releasing lock' })}`,
          this.handleStart.name,
          session,
          owner.email
        );
      }
    } else {
      // Destination does not exist, customer has stopped moving so
      // we can release lock
      await lock.release();
      this.warn(
        `${JSON.stringify({ warning: 'Releasing lock' })}`,
        this.handleStart.name,
        session,
        owner.email
      );
    }
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
    ownerID: string,
    stepID: string,
    session: string,
    customerID: string,
    lock: Lock,
    queryRunner: QueryRunner,
    transactionSession: mongoose.mongo.ClientSession,
    event?: string
  ) {
    const owner = await queryRunner.manager.findOne(Account, {
      where: { id: ownerID },
    });
    const currentStep = await queryRunner.manager.findOne(Step, {
      where: {
        id: stepID,
        type: StepType.TIME_DELAY,
      },
      lock: { mode: 'pessimistic_write' },
    });

    if (
      !_.find(currentStep.customers, (customer) => {
        return JSON.parse(customer).customerID === customerID;
      })
    ) {
      await lock.release();
      this.warn(
        `${JSON.stringify({ warning: 'Releasing lock' })}`,
        this.handleTimeDelay.name,
        session,
        owner.email
      );
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
      lock: { mode: 'pessimistic_write' },
    });

    let moveCustomer: boolean = false;
    let customerIndex = _.findIndex(currentStep.customers, (customer) => {
      return JSON.parse(customer).customerID === customerID;
    });
    if (
      Temporal.Duration.compare(
        currentStep.metadata.delay,
        Temporal.Now.instant().since(
          Temporal.Instant.from(
            JSON.parse(currentStep.customers[customerIndex]).timestamp
          )
        )
      ) < 0
    ) {
      moveCustomer = true;
    }

    if (nextStep && moveCustomer) {
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
          lock,
          event,
        });
      else {
        await lock.release();
        this.warn(
          `${JSON.stringify({ warning: 'Releasing lock' })}`,
          this.handleTimeDelay.name,
          session,
          owner.email
        );
      }
    } else {
      // Destination does not exist, customer has stopped moving so
      // we can release lock
      await lock.release();
      this.warn(
        `${JSON.stringify({ warning: 'Releasing lock' })}`,
        this.handleTimeDelay.name,
        session,
        owner.email
      );
    }
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
    ownerID: string,
    stepID: string,
    session: string,
    customerID: string,
    lock: Lock,
    queryRunner: QueryRunner,
    transactionSession: mongoose.mongo.ClientSession,
    event?: string
  ) {
    const owner = await queryRunner.manager.findOne(Account, {
      where: { id: ownerID },
    });
    const currentStep = await queryRunner.manager.findOne(Step, {
      where: {
        id: stepID,
        type: StepType.TIME_WINDOW,
      },
      lock: { mode: 'pessimistic_write' },
    });

    if (
      !_.find(currentStep.customers, (customer) => {
        return JSON.parse(customer).customerID === customerID;
      })
    ) {
      await lock.release();
      this.warn(
        `${JSON.stringify({ warning: 'Releasing lock' })}`,
        this.handleTimeWindow.name,
        session,
        owner.email
      );
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
      lock: { mode: 'pessimistic_write' },
    });

    let moveCustomer: boolean = false;
    let customerIndex = _.findIndex(currentStep.customers, (customer) => {
      return JSON.parse(customer).customerID === customerID;
    });
    if (
      Temporal.Duration.compare(
        currentStep.metadata.delay,
        Temporal.Now.instant().since(
          Temporal.Instant.from(
            JSON.parse(currentStep.customers[customerIndex]).timestamp
          )
        )
      ) < 0
    ) {
      moveCustomer = true;
    }

    if (nextStep && moveCustomer) {
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
          lock,
          event,
        });
      else {
        await lock.release();
        this.warn(
          `${JSON.stringify({ warning: 'Releasing lock' })}`,
          this.handleTimeWindow.name,
          session,
          owner.email
        );
      }
    } else {
      // Destination does not exist, customer has stopped moving so
      // we can release lock
      await lock.release();
      this.warn(
        `${JSON.stringify({ warning: 'Releasing lock' })}`,
        this.handleTimeWindow.name,
        session,
        owner.email
      );
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
    ownerID: string,
    stepID: string,
    session: string,
    customerID: string,
    lock: Lock,
    branch: number,
    queryRunner: QueryRunner,
    transactionSession: mongoose.mongo.ClientSession,
    event?: string
  ) {
    const owner = await queryRunner.manager.findOne(Account, {
      where: { id: ownerID },
    });

    const currentStep = await queryRunner.manager.findOne(Step, {
      where: {
        id: stepID,
        type: StepType.WAIT_UNTIL_BRANCH,
      },
      lock: { mode: 'pessimistic_write' },
    });

    if (
      !_.find(currentStep.customers, (customer) => {
        return JSON.parse(customer).customerID === customerID;
      })
    ) {
      await lock.release();
      this.warn(
        `${JSON.stringify({ warning: 'Releasing lock' })}`,
        this.handleWaitUntil.name,
        session,
        owner.email
      );
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

    let nextStep: Step,
      moveCustomer: boolean = false;

    // Time branch case
    if (branch < 0 && currentStep.metadata.timeBranch) {
      nextStep = await queryRunner.manager.findOne(Step, {
        where: {
          id: currentStep.metadata.timeBranch?.destination,
        },
        lock: { mode: 'pessimistic_write' },
      });
      if (currentStep.metadata.timeBranch.delay) {
        let customerIndex = _.findIndex(currentStep.customers, (customer) => {
          return JSON.parse(customer).customerID === customerID;
        });
        if (
          Temporal.Duration.compare(
            currentStep.metadata.timeBranch.delay,
            Temporal.Now.instant().since(
              Temporal.Instant.from(
                JSON.parse(currentStep.customers[customerIndex]).timestamp
              )
            )
          ) < 0
        ) {
          moveCustomer = true;
        }
      } else if (currentStep.metadata.timeBranch.window) {
      }
      if (nextStep && moveCustomer) {
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
            lock,
            event,
          });
        else {
          await lock.release();
          this.warn(
            `${JSON.stringify({ warning: 'Releasing lock' })}`,
            this.handleWaitUntil.name,
            session,
            owner.email
          );
        }
      } else {
        // Destination does not exist, customer has stopped moving so
        // we can release lock
        await lock.release();
        this.warn(
          `${JSON.stringify({ warning: 'Releasing lock' })}`,
          this.handleWaitUntil.name,
          session,
          owner.email
        );
      }
    } else if (branch > -1 && currentStep.metadata.branches.length > 0) {
      nextStep = await queryRunner.manager.findOne(Step, {
        where: {
          id: currentStep.metadata.branches.filter((branchItem) => {
            return branchItem.index === branch;
          })[0].destination,
        },
        lock: { mode: 'pessimistic_write' },
      });
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
            lock,
            event,
          });
        else {
          await lock.release();
          this.warn(
            `${JSON.stringify({ warning: 'Releasing lock' })}`,
            this.handleWaitUntil.name,
            session,
            owner.email
          );
        }
      } else {
        // Destination does not exist, customer has stopped moving so
        // we can release lock
        await lock.release();
        this.warn(
          `${JSON.stringify({ warning: 'Releasing lock' })}`,
          this.handleWaitUntil.name,
          session,
          owner.email
        );
      }
    } else {
      await lock.release();
      this.warn(
        `${JSON.stringify({ warning: 'Releasing lock' })}`,
        this.handleWaitUntil.name,
        session,
        owner.email
      );
    }
  }

  /**
   *
   * @param stepID
   * @param session
   * @param queryRunner
   * @param transactionSession
   */
  async handleAttributeBranch(
    ownerID: string,
    stepID: string,
    session: string,
    customerID: string,
    lock: Lock,
    queryRunner: QueryRunner,
    transactionSession: mongoose.mongo.ClientSession,
    event?: string
  ) {}

  /**
   *
   * @param stepID
   * @param session
   * @param queryRunner
   * @param transactionSession
   */
  async handleLoop(
    ownerID: string,
    stepID: string,
    session: string,
    customerID: string,
    lock: Lock,
    queryRunner: QueryRunner,
    transactionSession: mongoose.mongo.ClientSession,
    event?: string
  ) {
    const owner = await queryRunner.manager.findOne(Account, {
      where: { id: ownerID },
    });

    const currentStep = await queryRunner.manager.findOne(Step, {
      where: {
        id: stepID,
        type: StepType.LOOP,
      },
      lock: { mode: 'pessimistic_write' },
    });

    if (
      !_.find(currentStep.customers, (customer) => {
        return JSON.parse(customer).customerID === customerID;
      })
    ) {
      await lock.release();
      this.warn(
        `${JSON.stringify({ warning: 'Releasing lock' })}`,
        this.handleLoop.name,
        session,
        owner.email
      );
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
      lock: { mode: 'pessimistic_write' },
    });

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
          lock,
          event,
        });
      else {
        await lock.release();
        this.warn(
          `${JSON.stringify({ warning: 'Releasing lock' })}`,
          this.handleLoop.name,
          session,
          owner.email
        );
      }
    } else {
      // Destination does not exist, customer has stopped moving so
      // we can release lock
      await lock.release();
      this.warn(
        `${JSON.stringify({ warning: 'Releasing lock' })}`,
        this.handleLoop.name,
        session,
        owner.email
      );
    }
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
