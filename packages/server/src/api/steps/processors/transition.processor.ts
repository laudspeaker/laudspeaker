/* eslint-disable no-case-declarations */
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { HttpException, HttpStatus, Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { cpus } from 'os';
import { StepType } from '../types/step.interface';
import { Step } from '../entities/step.entity';
import { Account } from '@/api/accounts/entities/accounts.entity';
import { DataSource, QueryRunner } from 'typeorm';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { Temporal } from '@js-temporal/polyfill';
import { randomUUID } from 'crypto';
import { MessageSender, MessageType } from '../types/messagesender.class';
import { WebhooksService } from '@/api/webhooks/webhooks.service';
import { TemplatesService } from '@/api/templates/templates.service';
import { CustomersService } from '@/api/customers/customers.service';
import { cleanTagsForSending } from '../../../shared/utils/helpers';
import { CustomerDocument } from '@/api/customers/schemas/customer.schema';
import { TemplateType } from '@/api/templates/entities/template.entity';
import { WebsocketGateway } from '@/websockets/websocket.gateway';
import { ModalsService } from '@/api/modals/modals.service';
import { SlackService } from '@/api/slack/slack.service';


@Injectable()
@Processor('transition', { concurrency: cpus().length })
export class TransitionProcessor extends WorkerHost {
  constructor(
    private dataSource: DataSource,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @InjectQueue('transition') private readonly transitionQueue: Queue,
    @InjectQueue('webhooks') private readonly webhooksQueue: Queue,
    @InjectConnection() private readonly connection: mongoose.Connection,
    @Inject(WebhooksService) private readonly webhooksService: WebhooksService,
    @Inject(CustomersService) private readonly customersService: CustomersService,
    @Inject(TemplatesService)
    private readonly templatesService: TemplatesService,
    @Inject(WebsocketGateway)
    private websocketGateway: WebsocketGateway,
    @Inject(ModalsService) private modalsService: ModalsService,
    @Inject(SlackService) private slackService: SlackService,
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
          break;
        case StepType.EXIT:
          break;
        case StepType.LOOP:
          break;
        case StepType.MESSAGE:
          await this.handleMessage(job.data.step.id, job.data.session, queryRunner, transactionSession)
          break;
        case StepType.RANDOM_COHORT_BRANCH:
          break;
        case StepType.START:
          await this.handleStart(
            job.data.step.id,
            job.data.session,
            queryRunner,
            transactionSession
          );
          break;
        case StepType.TIME_DELAY:
          // await new Promise(r => setTimeout(r, 2000));
          await this.handleTimeDelay(
            job.data.step.id,
            job.data.session,
            queryRunner,
            transactionSession
          );
          break;
        case StepType.TIME_WINDOW:
          await this.handleTimeWindow(
            job.data.step.id,
            job.data.session,
            queryRunner,
            transactionSession
          );
          break;
        case StepType.WAIT_UNTIL_BRANCH:
          break;
        default:
          break;
      }
      await transactionSession.commitTransaction();
      await queryRunner.commitTransaction();
    } catch (err) {
      await transactionSession.abortTransaction();
      await queryRunner.rollbackTransaction();
      this.error(err, this.process.name, job.data.session);
      err = err;
    } finally {
      await transactionSession.endSession();
      await queryRunner.release();
      if (err) throw err;
    }
  }

  async handleABTest(
    stepID: string,
    accountID: string,
    session: string,
    queryRunner: QueryRunner,
    transactionSession: mongoose.mongo.ClientSession
  ) { }
  async handleAttributeBranch(job: Job<any, any, string>) { }
  async handleLoop(step: Step, account: Account, session: string) { }

  /**
   * Handle message step;
   * @param stepID
   * @param session
   * @param queryRunner
   * @param transactionSession
   */
  async handleMessage(
    stepID: string,
    session: string,
    queryRunner: QueryRunner,
    transactionSession: mongoose.mongo.ClientSession
  ) {
    const currentStep = await queryRunner.manager.findOne(Step, {
      where: {
        id: stepID,
        type: StepType.MESSAGE,
      },
      relations: ['owner'],
      lock: { mode: 'pessimistic_write' }
    });
    this.debug(
      `${JSON.stringify({ currentStep: currentStep })}`,
      this.handleMessage.name,
      session
    );
    const nextStep = await queryRunner.manager.findOne(Step, {
      where: {
        id: currentStep.metadata.destination
      },
      relations: ['owner'],
      lock: { mode: 'pessimistic_write' }
    });

    for (let i = 0; i < currentStep.customers.length; i++) {
      try {
        //send message here
        const customerID = JSON.parse(currentStep.customers[i]).customerID;
        const templateID = currentStep.metadata.template;
        const template = await this.templatesService.findOneById(
          currentStep.owner,
          templateID.toString()
        );
        const {
          mailgunAPIKey,
          sendingName,
          testSendingEmail,
          testSendingName,
          sendgridApiKey,
          sendgridFromEmail,
          email,
        } = currentStep.owner;
        let { sendingDomain, sendingEmail } = currentStep.owner;

        let key = mailgunAPIKey;
        let from = sendingName;
        const customer: CustomerDocument = await this.customersService.findById(currentStep.owner, customerID);
        const { _id, ownerId, workflows, journeys, ...tags } = customer.toObject();
        const filteredTags = cleanTagsForSending(tags);
        const sender = new MessageSender();

        switch (template.type) {
          case TemplateType.EMAIL:
            if (currentStep.owner.emailProvider === 'free3') {
              if (currentStep.owner.freeEmailsCount === 0)
                throw new HttpException(
                  'You exceeded limit of 3 emails',
                  HttpStatus.PAYMENT_REQUIRED
                );
              sendingDomain = process.env.MAILGUN_TEST_DOMAIN;
              key = process.env.MAILGUN_API_KEY;
              from = testSendingName;
              sendingEmail = testSendingEmail;
              currentStep.owner.freeEmailsCount--;
            }
            if (currentStep.owner.emailProvider === 'sendgrid') {
              key = sendgridApiKey;
              from = sendgridFromEmail;
            }
            let ret = await sender.process({
              name: TemplateType.EMAIL,
              accountID: currentStep.owner.id,
              cc: template.cc,
              customerId: customerID,
              domain: sendingDomain,
              email: sendingEmail,
              stepID: currentStep.id,
              from: from,
              trackingEmail: email,
              key: key,
              subject: await this.templatesService.parseApiCallTags(template.subject, filteredTags),
              to: customer.phEmail ? customer.phEmail : customer.email,
              text: await this.templatesService.parseApiCallTags(template.text, filteredTags),
              tags: filteredTags,
              templateId: template.id,
              eventProvider: currentStep.owner.emailProvider
            })
            this.debug(`${JSON.stringify(ret)}`, this.handleMessage.name, session)
            await this.webhooksService.insertClickHouseMessages(
              ret
            );
            if (currentStep.owner.emailProvider === 'free3') await currentStep.owner.save();
            break;
          case TemplateType.FIREBASE:
            await this.webhooksService.insertClickHouseMessages(
              await sender.process({
                name: TemplateType.FIREBASE,
                accountID: currentStep.owner.id,
                stepID: currentStep.id,
                customerID: customerID,
                firebaseCredentials: currentStep.owner.firebaseCredentials,
                phDeviceToken: customer.phDeviceToken,
                pushText: await this.templatesService.parseApiCallTags(template.pushText, filteredTags),
                pushTitle: await this.templatesService.parseApiCallTags(template.pushTitle, filteredTags),
                trackingEmail: email,
                filteredTags: filteredTags,
                templateID: template.id,
              }));
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
            const installation = await this.slackService.getInstallation(customer);
            await this.webhooksService.insertClickHouseMessages(
              await sender.process({
                name: TemplateType.SLACK,
                accountID: currentStep.owner.id,
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
                }
              })
            );
            break;
          case TemplateType.SMS:
            await this.webhooksService.insertClickHouseMessages(
              await sender.process({
                name: TemplateType.SMS,
                accountID: currentStep.owner.id,
                stepID: currentStep.id,
                customerID: customer.id,
                templateID: template.id,
                from: currentStep.owner.smsFrom,
                sid: currentStep.owner.smsAccountSid,
                tags: filteredTags,
                text: await this.templatesService.parseApiCallTags(template.smsText, filteredTags),
                to: customer.phPhoneNumber || customer.phone,
                token: currentStep.owner.smsAuthToken,
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
                accountId: currentStep.owner.id,
              });
            }
            break;
        }
      } catch (err) {
        this.error(err, this.handleMessage.name, session);
      }


      nextStep.customers.push(
        JSON.stringify({
          customerID: JSON.parse(currentStep.customers[i]).customerID,
          timestamp: new Date(),
        })
      );
    }
    currentStep.customers = [];
    await queryRunner.manager.save(currentStep);
    const newNext = await queryRunner.manager.save(nextStep);
    await this.transitionQueue.add(newNext.type, {
      step: newNext,
      session: session,
    });
  }

  async handleRandomCohortBranch(job: Job<any, any, string>) { }

  /**
   * Handle start step type; move all customers to next step and update
   * their step entry timestamps, then add next job to queue.
   * @param stepID
   * @param accountID
   * @param session
   * @param queryRunner
   * @param transactionSession
   */
  async handleStart(
    stepID: string,
    session: string,
    queryRunner: QueryRunner,
    transactionSession: mongoose.mongo.ClientSession
  ) {
    const currentStep = await queryRunner.manager.findOne(Step, {
      where: {
        id: stepID,
        type: StepType.START,
      },
      relations: ['owner'],
      lock: { mode: 'pessimistic_write' }
    });
    this.debug(
      `${JSON.stringify({ currentStep: currentStep })}`,
      this.handleStart.name,
      session
    );

    const nextStep = await queryRunner.manager.findOne(Step, {
      where: {
        id: currentStep.metadata.destination,
      },
      relations: ['owner'],
      lock: { mode: 'pessimistic_write' }
    });
    this.debug(
      `${JSON.stringify({ nextStep: nextStep })}`,
      this.handleStart.name,
      session
    );

    for (let i = 0; i < currentStep.customers.length; i++) {
      nextStep.customers.push(
        JSON.stringify({
          customerID: JSON.parse(currentStep.customers[i]).customerID,
          timestamp: new Date(),
        })
      );
    }
    currentStep.customers = [];

    this.debug(
      `${JSON.stringify({ currentStep: currentStep, nextStep: nextStep })}`,
      this.handleStart.name,
      session
    );

    await queryRunner.manager.save(currentStep);
    const newNext = await queryRunner.manager.save(nextStep);
    this.debug(
      `${JSON.stringify({ newNext: newNext })}`,
      this.handleStart.name,
      session
    );

    await this.transitionQueue.add(newNext.type, {
      step: newNext,
      session: session,
    });
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
    stepID: string,
    session: string,
    queryRunner: QueryRunner,
    transactionSession: mongoose.mongo.ClientSession
  ) {
    const currentStep = await queryRunner.manager.findOne(Step, {
      where: {
        id: stepID,
        type: StepType.TIME_DELAY,
      },
      relations: ['owner'],
      lock: { mode: 'pessimistic_write' }
    });

    this.debug(
      `${JSON.stringify({ currentStep: currentStep })}`,
      this.handleTimeDelay.name,
      session
    );

    const nextStep = await queryRunner.manager.findOne(Step, {
      where: { id: currentStep.metadata.destination, },
      relations: ['owner'],
      lock: { mode: 'pessimistic_write' }
    });

    this.debug(
      `${JSON.stringify({ nextStep: nextStep })}`,
      this.handleTimeDelay.name,
      session
    );

    const forDeletion = [];
    for (let i = 0; i < currentStep.customers.length; i++) {
      if (
        Temporal.Duration.compare(
          currentStep.metadata.delay,
          Temporal.Now.instant().since(
            Temporal.Instant.from(
              JSON.parse(currentStep.customers[i]).timestamp
            )
          )
        ) < 0
      ) {
        nextStep.customers.push(
          JSON.stringify({
            customerID: JSON.parse(currentStep.customers[i]).customerID,
            timestamp: Temporal.Now.instant().toString(),
          })
        );
        forDeletion.push(currentStep.customers[i]);
      }
    }
    currentStep.customers = currentStep.customers.filter(
      (item) => !forDeletion.includes(item)
    );
    await queryRunner.manager.save(currentStep);
    const newNext = await queryRunner.manager.save(nextStep);

    if (forDeletion.length > 0)
      await this.transitionQueue.add(newNext.type, {
        step: newNext,
        session: session,
      });
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
    stepID: string,
    session: string,
    queryRunner: QueryRunner,
    transactionSession: mongoose.mongo.ClientSession
  ) {
    const currentStep = await queryRunner.manager.findOneBy(Step, {
      id: stepID,
      type: StepType.TIME_DELAY,
    });
    const nextStep = await queryRunner.manager.findOneBy(Step, {
      id: currentStep.metadata.destination,
    });
    const forDeletion = [];
    for (let i = 0; i < currentStep.customers.length; i++) {
      if (
        Temporal.Duration.compare(
          currentStep.metadata.delay,
          Temporal.Now.instant().since(
            Temporal.Instant.from(
              JSON.parse(currentStep.customers[i]).timestamp
            )
          )
        ) < 0
      ) {
        nextStep.customers.push(
          JSON.stringify({
            customerID: JSON.parse(currentStep.customers[i]).customerID,
            timestamp: Temporal.Now.instant().toString(),
          })
        );
        forDeletion.push(currentStep.customers[i]);
      }
    }
    currentStep.customers = currentStep.customers.filter(
      (item) => !forDeletion.includes(item)
    );
    await queryRunner.manager.save(currentStep);
    await queryRunner.manager.save(nextStep);

    if (forDeletion.length > 0)
      this.transitionQueue.add('', {
        stepID: nextStep.id,
        session: session,
      });
  }

  async handleWaitUntil(job: Job<any, any, string>) { }

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
}
