/* eslint-disable no-case-declarations */
import { HttpException, HttpStatus, Inject, Logger } from '@nestjs/common';
import * as http from 'node:http';
import https from 'https';
import { Injectable } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import {
  OnWorkerEvent,
} from '@nestjs/bullmq';
import { Job, MetricsTime, Queue } from 'bullmq';
import { StepType } from '../types/step.interface';
import { Step } from '../entities/step.entity';
import { Account } from '../../accounts/entities/accounts.entity';
import * as _ from 'lodash';
import * as Sentry from '@sentry/node';
import { JourneyLocationsService } from '../../journeys/journey-locations.service';
import { StepsService } from '../steps.service';
import { Journey } from '../../journeys/entities/journey.entity';
import { JourneyLocation } from '../../journeys/entities/journey-location.entity';
import { CacheService } from '../../../common/services/cache.service';
import { JourneysService } from '../../journeys/journeys.service';
import { convertTimeToUTC, isWithinInterval } from '../../../common/helper/timing';
import { JourneySettingsQuietFallbackBehavior } from '../../journeys/types/additional-journey-settings.interface';
import {
  Template,
  TemplateType,
} from '../../templates/entities/template.entity';
import { TemplatesService } from '../../templates/templates.service';
import { cleanTagsForSending } from '../../../shared/utils/helpers';
import { MessageSender } from '../types/messagesender.class';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhooksService } from '../../webhooks/webhooks.service';
import { OrganizationService } from '../../organizations/organizations.service';
import { Processor } from '../../../common/services/queue/decorators/processor';
import { ProcessorBase } from '../../../common/services/queue/classes/processor-base';
import { QueueType } from '../../../common/services/queue/types/queue-type';
import { Producer } from '../../../common/services/queue/classes/producer';
import { ClickHouseEventProvider } from '../../../common/services/clickhouse/types/clickhouse-event-provider';
import { Customer } from '../../customers/entities/customer.entity';
import { CacheConstants } from '../../../common/services/cache.constants';

@Injectable()
@Processor(
  'message.step', {
    maxRetries: {
      count: 0,
    }
  })
export class MessageStepProcessor extends ProcessorBase {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @Inject(JourneyLocationsService)
    private journeyLocationsService: JourneyLocationsService,
    @Inject(JourneysService)
    private journeysService: JourneysService,
    @Inject(StepsService) private stepsService: StepsService,
    @Inject(CacheService) private cacheService: CacheService,
    @Inject(TemplatesService) private templatesService: TemplatesService,
    @Inject(OrganizationService)
    private organizationService: OrganizationService,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>,
    @Inject(WebhooksService)
    private readonly webhooksService: WebhooksService,
  ) {
    super();
  }

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: MessageStepProcessor.name,
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
        class: MessageStepProcessor.name,
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
        class: MessageStepProcessor.name,
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
        class: MessageStepProcessor.name,
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
        class: MessageStepProcessor.name,
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
        customer: Customer;
        location: JourneyLocation;
        session: string;
        event?: string;
        branch?: number;
        stepDepth: number;
      },
      any,
      string
    >
  ): Promise<any> {
    return Sentry.startSpan(
      { name: 'MessageStepProcessor.process' },
      async () => {
        let nextJob;
        const workspace =
          job.data.owner.teams?.[0]?.organization?.workspaces?.[0];

        const workspaceIds =
          job.data.owner.teams?.[0]?.organization?.workspaces?.map(
            (workspace) => workspace.id
          );

        if (job.data.owner.teams?.[0]?.organization.plan.messageLimit != -1) {
          //off for now for perf reasons
          // to do
          //await this.organizationService.checkOrganizationMessageLimit(
          //  workspaceIds || [], 1 , job.data.owner.teams?.[0]?.organization.plan.messageLimit
          //);
        }

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
          job.data.journey.journeySettings &&
          job.data.journey.journeySettings.quietHours &&
          job.data.journey.journeySettings.quietHours.enabled
        ) {
          const quietHours = job.data.journey.journeySettings.quietHours!;
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
          }
        }

        if (messageSendType === 'SEND') {
          // 1. CHECK RATE LIMITING BY UNIQUE CUSTOMERS MESSAGED
          const [customersMessagedLimitEnabled] =
            this.journeysService.rateLimitByCustomersMessagedEnabled(
              job.data.journey
            );
          if (customersMessagedLimitEnabled) {
            const doRateLimit =
              await this.journeysService.rateLimitByCustomersMessaged(
                job.data.owner,
                job.data.journey,
                job.data.session
              );
            if (doRateLimit) {
              messageSendType = 'LIMIT_HOLD';
            }
          }
        }

        if (messageSendType === 'SEND') {
          // 2. CHECK RATE LIMITING BY NUMBER MESSAGES SENT IN LAST HOUR
          const [rateLimitByMinuteEnabled] =
            this.journeysService.rateLimitByMinuteEnabled(job.data.journey);
          if (rateLimitByMinuteEnabled) {
            const doRateLimit = await this.journeysService.rateLimitByMinute(
              job.data.owner,
              job.data.journey
            );
            if (doRateLimit) {
              messageSendType = 'LIMIT_REQUEUE';
              requeueTime = new Date();
              requeueTime.setMinutes(requeueTime.getMinutes() + 1);
            }
          }
        }

        let template: Template = await this.cacheService.getIgnoreError(
          CacheConstants.TEMPLATES,
          job.data.step.metadata.template,
          async () => {
            return await this.templatesService.lazyFindByID(
              job.data.step.metadata.template
            );
          }
        );

        if (
          messageSendType === 'SEND' &&
          process.env.MOCK_MESSAGE_SEND === 'true' &&
          template &&
          !template.webhookData
        ) {
          // 3. CHECK IF MESSAGE SEND SHOULD BE MOCKED
          messageSendType = 'MOCK_SEND';
        }

        if (messageSendType === 'SEND') {
          //send message here

          const { email } = job.data.owner;

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

          const { id, ...tags } =
            job.data.customer;
          const filteredTags = cleanTagsForSending(tags);
          const sender = new MessageSender(this.logger, this.accountRepository);

          switch (template.type) {
            case TemplateType.EMAIL:
              const mailgunChannel = workspace.mailgunConnections.find(
                (connection) =>
                  connection.id === job.data.step?.metadata?.connectionId
              );
              const sendgridChannel = workspace.sendgridConnections.find(
                (connection) =>
                  connection.id === job.data.step?.metadata?.connectionId
              );
              const resendChannel = workspace.resendConnections.find(
                (connection) =>
                  connection.id === job.data.step?.metadata?.connectionId
              );

              const emailProvider = mailgunChannel
                ? 'mailgun'
                : sendgridChannel
                ? 'sendgrid'
                : resendChannel
                ? 'resend'
                : undefined;

              // if (emailProvider === 'free3') {
              //   if (workspace.freeEmailsCount === 0)
              //     throw new HttpException(
              //       'You exceeded limit of 3 emails',
              //       HttpStatus.PAYMENT_REQUIRED
              //     );
              //   sendingDomain = process.env.MAILGUN_TEST_DOMAIN;
              //   key = process.env.MAILGUN_API_KEY;
              //   from = testSendingName;
              //   sendingEmail = testSendingEmail;
              //   workspace.freeEmailsCount--;
              // }

              let key: string,
                sendingDomain: string,
                from: string,
                sendingEmail: string;

              switch (emailProvider) {
                case 'mailgun':
                  key = mailgunChannel.apiKey;
                  sendingDomain = mailgunChannel.sendingDomain;
                  const mailgunSendingOption =
                    mailgunChannel.sendingOptions.find(
                      ({ id }) =>
                        id === job.data.step?.metadata?.sendingOptionId
                    );
                  from = mailgunSendingOption.sendingName;
                  sendingEmail = mailgunSendingOption.sendingEmail;
                  break;
                case 'sendgrid':
                  key = sendgridChannel.apiKey;
                  const sendgridSendingOption =
                    sendgridChannel.sendingOptions.find(
                      ({ id }) =>
                        id === job.data.step?.metadata?.sendingOptionId
                    );
                  from = sendgridSendingOption.sendingEmail;
                  break;
                case 'resend':
                  sendingDomain = resendChannel.sendingDomain;
                  key = resendChannel.apiKey;
                  const resendSendingOption = resendChannel.sendingOptions.find(
                    ({ id }) => id === job.data.step?.metadata?.sendingOptionId
                  );
                  from = resendSendingOption.sendingName;
                  sendingEmail = resendSendingOption.sendingEmail;
                  break;
                default:
                  break;
              }

              const ret = await sender.process({
                name: TemplateType.EMAIL,
                accountID: job.data.owner.id,
                cc: template.cc,
                customerID: job.data.customer.uuid,
                domain: sendingDomain,
                email: sendingEmail,
                stepID: job.data.step.id,
                from: from,
                trackingEmail: email,
                key: key,
                subject: await this.templatesService.parseApiCallTags(
                  template.subject,
                  filteredTags
                ),
                to: job.data.customer.user_attributes.phEmail
                  ? job.data.customer.user_attributes.phEmail
                  : job.data.customer.user_attributes.email,
                text: await this.templatesService.parseApiCallTags(
                  template.text,
                  filteredTags
                ),
                tags: filteredTags,
                templateID: template.id,
                eventProvider: emailProvider,
                session: job.data.session,
              });
              this.debug(
                `${JSON.stringify(ret)}`,
                this.process.name,
                job.data.session
              );

              await this.webhooksService.insertMessageStatusToClickhouse(
                ret,
                job.data.session
              );
              // if (emailProvider === 'free3') {
              //   await job.data.owner.save();
              //   await workspace.save();
              // }
              break;
            case TemplateType.PUSH:
              // Temporarily disabling until we have ability to select push channel in UI
              // const pushChannel = workspace.pushConnections.find(
              //   (connection) => connection.id === job.data.step?.metadata?.connectionId
              // );

              switch (job.data.step.metadata.selectedPlatform) {
                case 'All':
                  await this.webhooksService.insertMessageStatusToClickhouse(
                    await sender.process({
                      name: 'android',
                      accountID: job.data.owner.id,
                      stepID: job.data.step.id,
                      customerID: job.data.customer.uuid,
                      firebaseCredentials:
                        workspace?.pushPlatforms?.Android?.credentials,
                      // pushChannel?.pushPlatforms?.Android?.credentials,
                      deviceToken: job.data.customer.user_attributes.androidDeviceToken,
                      pushTitle: template.pushObject.settings.Android.title,
                      pushText:
                        template.pushObject.settings.Android.description,
                      kvPairs: template.pushObject.fields,
                      trackingEmail: email,
                      filteredTags: filteredTags,
                      templateID: template.id,
                      quietHours: job.data.journey.journeySettings.quietHours
                        .enabled
                        ? job.data.journey.journeySettings?.quietHours
                        : undefined,
                      session: job.data.session,
                    }),
                    job.data.session
                  );
                  await this.webhooksService.insertMessageStatusToClickhouse(
                    await sender.process({
                      name: 'ios',
                      accountID: job.data.owner.id,
                      stepID: job.data.step.id,
                      customerID: job.data.customer.uuid,
                      firebaseCredentials:
                        workspace?.pushPlatforms?.iOS?.credentials,
                      // pushChannel?.pushPlatforms?.iOS?.credentials,
                      deviceToken: job.data.customer.user_attributes.iosDeviceToken,
                      pushTitle: template.pushObject.settings.iOS.title,
                      pushText: template.pushObject.settings.iOS.description,
                      kvPairs: template.pushObject.fields,
                      trackingEmail: email,
                      filteredTags: filteredTags,
                      templateID: template.id,
                      quietHours: job.data.journey.journeySettings.quietHours
                        .enabled
                        ? job.data.journey.journeySettings?.quietHours
                        : undefined,
                      session: job.data.session,
                    }),
                    job.data.session
                  );
                  break;
                case 'iOS':
                  await this.webhooksService.insertMessageStatusToClickhouse(
                    await sender.process({
                      name: 'ios',
                      accountID: job.data.owner.id,
                      stepID: job.data.step.id,
                      customerID: job.data.customer.uuid,
                      firebaseCredentials:
                        workspace?.pushPlatforms?.iOS?.credentials,
                      // pushChannel?.pushPlatforms?.iOS?.credentials,
                      deviceToken: job.data.customer.user_attributes.iosDeviceToken,
                      pushTitle: template.pushObject.settings.iOS.title,
                      pushText: template.pushObject.settings.iOS.description,
                      kvPairs: template.pushObject.fields,
                      trackingEmail: email,
                      filteredTags: filteredTags,
                      templateID: template.id,
                      quietHours: job.data.journey.journeySettings.quietHours
                        .enabled
                        ? job.data.journey.journeySettings?.quietHours
                        : undefined,
                      session: job.data.session,
                    }),
                    job.data.session
                  );
                  break;
                case 'Android':
                  await this.webhooksService.insertMessageStatusToClickhouse(
                    await sender.process({
                      name: 'android',
                      accountID: job.data.owner.id,
                      stepID: job.data.step.id,
                      customerID: job.data.customer.uuid,
                      firebaseCredentials:
                        workspace?.pushPlatforms?.Android?.credentials,
                      // pushChannel?.pushPlatforms?.Android?.credentials,
                      deviceToken: job.data.customer.user_attributes.androidDeviceToken,
                      pushTitle: template.pushObject.settings.Android.title,
                      pushText:
                        template.pushObject.settings.Android.description,
                      trackingEmail: email,
                      kvPairs: template.pushObject.fields,
                      filteredTags: filteredTags,
                      templateID: template.id,
                      quietHours: job.data.journey.journeySettings.quietHours
                        .enabled
                        ? job.data.journey.journeySettings?.quietHours
                        : undefined,
                      session: job.data.session,
                    }),
                    job.data.session
                  );
                  break;
              }
              break;
            case TemplateType.SMS:
              await this.webhooksService.insertMessageStatusToClickhouse(
                await sender.process({
                  name: TemplateType.SMS,
                  accountID: job.data.owner.id,
                  stepID: job.data.step.id,
                  customerID: job.data.customer.uuid,
                  templateID: template.id,
                  from: workspace.smsFrom,
                  sid: workspace.smsAccountSid,
                  tags: filteredTags,
                  text: await this.templatesService.parseApiCallTags(
                    template.smsText,
                    filteredTags
                  ),
                  to:
                    job.data.customer.user_attributes.phPhoneNumber || job.data.customer.user_attributes.phone,
                  token: workspace.smsAuthToken,
                  trackingEmail: email,
                  session: job.data.session,
                }),
                job.data.session
              );
              break;
            case TemplateType.WEBHOOK: //TODO:remove this from queue
              if (template.webhookData) {
                const webhookJobData = {
                  template,
                  filteredTags,
                  stepId: job.data.step.id,
                  customerId: job.data.customer.uuid,
                  accountId: job.data.owner.id,
                  stepDepth: job.data.stepDepth,
                };

                await Producer.add(
                  QueueType.WEBHOOKS,
                  webhookJobData
                );
              }
              break;
          }

          // After send, update rate limit stuff
          // await this.journeyLocationsService.setMessageSent(location);
          job.data.location = { ...job.data.location, messageSent: true };
          await this.journeysService.rateLimitByMinuteIncrement(
            job.data.owner,
            job.data.journey
          );
        } else if (messageSendType === 'QUIET_ABORT') {
          // Record that the message was aborted
          await this.webhooksService.insertMessageStatusToClickhouse(
            [
              {
                stepId: job.data.step.id,
                createdAt: new Date(),
                customerId: job.data.customer.uuid.toString(),
                event: 'aborted',
                eventProvider: ClickHouseEventProvider.TRACKER,
                messageId: job.data.step.metadata.humanReadableName,
                templateId: job.data.step.metadata.template,
                workspaceId: workspace.id,
                processed: true,
              },
            ],
            job.data.session
          );
        } else if (messageSendType === 'MOCK_SEND') {
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
            } catch (e) {
              this.error(
                e,
                this.process.name,
                job.data.session,
                job.data.owner.email
              );
            }
          }
          await this.webhooksService.insertMessageStatusToClickhouse(
            [
              {
                stepId: job.data.step.id,
                createdAt: new Date(),
                customerId: job.data.customer.uuid.toString(),
                event: 'sent',
                eventProvider: ClickHouseEventProvider.TRACKER,
                messageId: job.data.step.metadata.humanReadableName,
                templateId: job.data.step.metadata.template,
                workspaceId: workspace.id,
                processed: true,
              },
            ],
            job.data.session
          );
          // After mock send, update rate limit stuff
          // await this.journeyLocationsService.setMessageSent(location);
          job.data.location = { ...job.data.location, messageSent: true };
          await this.journeysService.rateLimitByMinuteIncrement(
            job.data.owner,
            job.data.journey
          );
        } else if (messageSendType === 'LIMIT_HOLD') {
          await this.journeyLocationsService.unlock(
            job.data.location,
            job.data.step.id
          );
          return;
        } else if (
          messageSendType === 'QUIET_REQUEUE' ||
          messageSendType === 'LIMIT_REQUEUE'
        ) {
          await this.stepsService.requeueMessage(
            job.data.owner,
            job.data.step,
            job.data.customer.id.toString(),
            requeueTime,
            job.data.session
          );
          await this.journeyLocationsService.unlock(
            job.data.location,
            job.data.step.id
          );
          return;
        }

        let nextStep: Step = await this.cacheService.getIgnoreError(
          CacheConstants.STEPS,
          job.data.step.metadata.destination,
          async () => {
            return await this.stepsService.lazyFindByID(
              job.data.step.metadata.destination
            );
          }
        );

        if (nextStep) {
          const nextStepDepth: number =
            Producer.getNextStepDepthFromJob(job);

          if (
            nextStep.type !== StepType.TIME_DELAY &&
            nextStep.type !== StepType.TIME_WINDOW &&
            nextStep.type !== StepType.WAIT_UNTIL_BRANCH
          ) {
            nextJob = {
              owner: job.data.owner,
              journey: job.data.journey,
              step: nextStep,
              session: job.data.session,
              customer: job.data.customer,
              location: job.data.location,
              event: job.data.event,
              stepDepth: nextStepDepth,
            };
          } else {
            // Destination is time based,
            // customer has stopped moving so we can release lock
            await this.journeyLocationsService.unlock(
              job.data.location,
              nextStep.id
            );
          }
        } else {
          // Destination does not exist,
          // customer has stopped moving so we can release lock
          await this.journeyLocationsService.unlock(
            job.data.location,
            job.data.step.id
          );
        }
        if (nextStep && nextJob)
          await Producer.addByStepType(nextStep.type, nextJob);
      }
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error, prev?: string) {
    Sentry.withScope((scope) => {
      scope.setTag('job_id', job.id);
      scope.setTag('processor', MessageStepProcessor.name);
      Sentry.captureException(error);
    });
  }
}
