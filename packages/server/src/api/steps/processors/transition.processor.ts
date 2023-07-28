/* eslint-disable no-case-declarations */
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { HttpException, HttpStatus, Inject, Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { cpus } from 'os';
import { CustomComponentAction, StepType } from '../types/step.interface';
import { Step } from '../entities/step.entity';
import { DataSource, QueryRunner } from 'typeorm';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Temporal } from '@js-temporal/polyfill';
import { randomUUID } from 'crypto';
import { MessageSender } from '../types/messagesender.class';
import { WebhooksService } from '@/api/webhooks/webhooks.service';
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

@Injectable()
@Processor('transition', {
  concurrency: cpus().length,
  // removeOnComplete: { age: 0, count: 0 },
})
export class TransitionProcessor extends WorkerHost {
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
    @InjectModel(Customer.name) public customerModel: Model<CustomerDocument>
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
            queryRunner,
            transactionSession
          );
          break;
        case StepType.EXIT:
          break;
        case StepType.LOOP:
          await this.handleLoop(
            job.data.ownerID,
            job.data.step.id,
            job.data.session,
            queryRunner,
            transactionSession
          );
          break;
        case StepType.MESSAGE:
          await this.handleMessage(
            job.data.ownerID,
            job.data.step.id,
            job.data.session,
            queryRunner,
            transactionSession
          );
          break;
        case StepType.TRACKER:
          await this.handleCustomComponent(
            job.data.ownerID,
            job.data.step.id,
            job.data.session,
            queryRunner,
            transactionSession
          );
          break;
        case StepType.RANDOM_COHORT_BRANCH:
          break;
        case StepType.START:
          await this.handleStart(
            job.data.ownerID,
            job.data.step.id,
            job.data.session,
            queryRunner,
            transactionSession
          );
          break;
        case StepType.TIME_DELAY:
          await this.handleTimeDelay(
            job.data.ownerID,
            job.data.step.id,
            job.data.session,
            queryRunner,
            transactionSession
          );
          break;
        case StepType.TIME_WINDOW:
          await this.handleTimeWindow(
            job.data.ownerID,
            job.data.step.id,
            job.data.session,
            queryRunner,
            transactionSession
          );
          break;
        case StepType.WAIT_UNTIL_BRANCH:
          await this.handleWaitUntil(
            job.data.ownerID,
            job.data.step.id,
            job.data.session,
            job.data.customer,
            job.data.branch,
            queryRunner,
            transactionSession
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
    queryRunner: QueryRunner,
    transactionSession: mongoose.mongo.ClientSession
  ) {
    const owner = await queryRunner.manager.findOne(Account, {
      where: { id: ownerID },
    });
    this.debug(
      `${JSON.stringify({ owner: owner })}`,
      this.handleCustomComponent.name,
      session
    );

    const currentStep = await queryRunner.manager.findOne(Step, {
      where: {
        id: stepID,
        type: StepType.TRACKER,
      },
      lock: { mode: 'pessimistic_write' },
    });

    this.debug(
      `${JSON.stringify({ currentStep: currentStep })}`,
      this.handleCustomComponent.name,
      session
    );

    const nextStep = await queryRunner.manager.findOne(Step, {
      where: {
        id: currentStep.metadata.destination,
      },
      lock: { mode: 'pessimistic_write' },
    });

    this.debug(
      `${JSON.stringify({ nextStep: nextStep })}`,
      this.handleCustomComponent.name,
      session
    );

    for (let i = 0; i < currentStep.customers.length; i++) {
      try {
        //send message here
        const customerID = JSON.parse(currentStep.customers[i]).customerID;
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
        const { action, humanReadableName, pushedValues } =
          currentStep.metadata;

        if (!customer.customComponents) customer.customComponents = {};

        if (!customer.customComponents[humanReadableName])
          customer.customComponents[humanReadableName] = {
            hidden: true,
            ...template.customFields,
          };

        customer.customComponents[humanReadableName].hidden =
          action === CustomComponentAction.HIDE ? true : false;
        customer.customComponents[humanReadableName] = {
          ...customer.customComponents[humanReadableName],
          ...pushedValues,
        };

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

        const isSent = await this.websocketGateway.sendCustomComponentState(
          customer.id,
          humanReadableName,
          customer.customComponents[humanReadableName]
        );
        if (!isSent)
          this.debug(
            JSON.stringify({ warning: 'Socket not connected...' }),
            this.handleCustomComponent.name,
            session,
            owner.email
          );
      } catch (err) {
        this.error(err, this.handleCustomComponent.name, session);
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
      ownerID,
      step: newNext,
      session: session,
    });
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
    queryRunner: QueryRunner,
    transactionSession: mongoose.mongo.ClientSession
  ) {
    const owner = await queryRunner.manager.findOne(Account, {
      where: { id: ownerID },
    });
    const currentStep = await queryRunner.manager.findOne(Step, {
      where: {
        id: stepID,
        type: StepType.MESSAGE,
      },
      lock: { mode: 'pessimistic_write' },
    });
    this.debug(
      `${JSON.stringify({ currentStep: currentStep })}`,
      this.handleMessage.name,
      session
    );
    const nextStep = await queryRunner.manager.findOne(Step, {
      where: {
        id: currentStep.metadata.destination,
      },
      lock: { mode: 'pessimistic_write' },
    });

    for (let i = 0; i < currentStep.customers.length; i++) {
      try {
        //send message here
        const customerID = JSON.parse(currentStep.customers[i]).customerID;
        const templateID = currentStep.metadata.template;
        this.debug(
          `${JSON.stringify({ metadata: currentStep.metadata.template })}`,
          this.handleMessage.name,
          session
        );
        this.debug(
          `${JSON.stringify({ templateID: templateID })}`,
          this.handleMessage.name,
          session
        );
        const template = await this.templatesService.transactionalFindOneById(
          owner,
          templateID.toString(),
          queryRunner
        );
        this.debug(
          `${JSON.stringify({ template: template })}`,
          this.handleMessage.name,
          session
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
            await this.webhooksService.insertClickHouseMessages(ret);
            if (owner.emailProvider === 'free3') await owner.save();
            break;
          case TemplateType.FIREBASE:
            await this.webhooksService.insertClickHouseMessages(
              await sender.process({
                name: TemplateType.FIREBASE,
                accountID: owner.id,
                stepID: currentStep.id,
                customerID: customerID,
                firebaseCredentials: owner.firebaseCredentials,
                phDeviceToken: customer.phDeviceToken,
                pushText: await this.templatesService.parseApiCallTags(
                  template.pushText,
                  filteredTags
                ),
                pushTitle: await this.templatesService.parseApiCallTags(
                  template.pushTitle,
                  filteredTags
                ),
                trackingEmail: email,
                filteredTags: filteredTags,
                templateID: template.id,
              })
            );
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
            await this.webhooksService.insertClickHouseMessages(
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
            await this.webhooksService.insertClickHouseMessages(
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
      ownerID,
      step: newNext,
      session: session,
    });
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
    queryRunner: QueryRunner,
    transactionSession: mongoose.mongo.ClientSession
  ) {
    const owner = await queryRunner.manager.findOne(Account, {
      where: { id: ownerID },
    });
    const startStep = await queryRunner.manager.findOne(Step, {
      where: {
        id: stepID,
        type: StepType.START,
      },
      lock: { mode: 'pessimistic_write' },
    });

    const nextStep = await queryRunner.manager.findOne(Step, {
      where: {
        id: startStep.metadata.destination,
      },
      lock: { mode: 'pessimistic_write' },
    });

    const forDeletion = [];
    for (let i = 0; i < startStep.customers.length; i++) {
      nextStep.customers.push(
        JSON.stringify({
          customerID: JSON.parse(startStep.customers[i]).customerID,
          timestamp: new Date(),
        })
      );
      forDeletion.push(startStep.customers[i]);
    }
    startStep.customers = startStep.customers.filter(
      (item) => !forDeletion.includes(item)
    );

    await queryRunner.manager.save(startStep);
    const newNext: Step = await queryRunner.manager.save(nextStep);

    if (
      newNext.type !== StepType.TIME_DELAY &&
      newNext.type !== StepType.TIME_WINDOW &&
      newNext.type !== StepType.WAIT_UNTIL_BRANCH
    ) {
      await this.transitionQueue.add(newNext.type, {
        ownerID,
        step: newNext,
        session: session,
      });
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
    queryRunner: QueryRunner,
    transactionSession: mongoose.mongo.ClientSession
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

    this.debug(
      `${JSON.stringify({ currentStep: currentStep })}`,
      this.handleTimeDelay.name,
      session
    );

    const nextStep = await queryRunner.manager.findOne(Step, {
      where: { id: currentStep.metadata.destination },
      lock: { mode: 'pessimistic_write' },
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
        ownerID,
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
    ownerID: string,
    stepID: string,
    session: string,
    queryRunner: QueryRunner,
    transactionSession: mongoose.mongo.ClientSession
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
    const nextStep = await queryRunner.manager.findOne(Step, {
      where: { id: currentStep.metadata.destination },
      lock: { mode: 'pessimistic_write' },
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
        ownerID,
        step: nextStep,
        session: session,
      });
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
    branch: number,
    queryRunner: QueryRunner,
    transactionSession: mongoose.mongo.ClientSession
  ) {
    let nextStep: Step,
      forDeletion: string[] = [];
    const owner = await queryRunner.manager.findOne(Account, {
      where: { id: ownerID },
    });
    const waitUntilStep = await queryRunner.manager.findOne(Step, {
      where: {
        id: stepID,
        type: StepType.WAIT_UNTIL_BRANCH,
      },
      lock: { mode: 'pessimistic_write' },
    });
    this.debug(
      `${JSON.stringify({
        stepID,
        session,
        customerID,
        branch,
        waitUntilStep,
      })}`,
      this.handleWaitUntil.name,
      session
    );
    if (branch < 0 && waitUntilStep.metadata.timeBranch) {
      nextStep = await queryRunner.manager.findOne(Step, {
        where: {
          id: waitUntilStep.metadata.timeBranch?.destination,
        },
        lock: { mode: 'pessimistic_write' },
      });
      this.debug(
        `${JSON.stringify({ nextStep: nextStep })}`,
        this.handleWaitUntil.name,
        session
      );
      if (waitUntilStep.metadata.timeBranch.delay) {
        for (let i = 0; i < waitUntilStep.customers.length; i++) {
          if (
            Temporal.Duration.compare(
              waitUntilStep.metadata.timeBranch.delay,
              Temporal.Now.instant().since(
                Temporal.Instant.from(
                  JSON.parse(waitUntilStep.customers[i]).timestamp
                )
              )
            ) < 0
          ) {
            nextStep.customers.push(
              JSON.stringify({
                customerID: JSON.parse(waitUntilStep.customers[i]).customerID,
                timestamp: Temporal.Now.instant().toString(),
              })
            );
            forDeletion.push(waitUntilStep.customers[i]);
          }
        }
        waitUntilStep.customers = waitUntilStep.customers.filter(
          (item) => !forDeletion.includes(item)
        );
      } else if (waitUntilStep.metadata.timeBranch.window) {
      }
      await queryRunner.manager.save(waitUntilStep);
      const newNext: Step = await queryRunner.manager.save(nextStep);
      this.debug(
        `${JSON.stringify({ newNext: newNext })}`,
        this.handleWaitUntil.name,
        session
      );
      if (
        forDeletion.length > 0 &&
        newNext.type !== StepType.TIME_DELAY &&
        newNext.type !== StepType.TIME_WINDOW &&
        newNext.type !== StepType.WAIT_UNTIL_BRANCH
      ) {
        this.transitionQueue.add(newNext.type, {
          ownerID,
          step: newNext,
          session: session,
        });
      }
    } else if (branch > -1 && waitUntilStep.metadata.branches.length > 0) {
      nextStep = await queryRunner.manager.findOne(Step, {
        where: {
          id: waitUntilStep.metadata.branches.filter((branchItem) => {
            return branchItem.index === branch;
          })[0].destination,
        },
        lock: { mode: 'pessimistic_write' },
      });
      for (
        let customersIndex = 0;
        customersIndex < waitUntilStep.customers.length;
        customersIndex++
      ) {
        const customerTimestampTuple = JSON.parse(
          waitUntilStep.customers[customersIndex]
        );
        if (customerTimestampTuple.customerID === customerID) {
          forDeletion.push(waitUntilStep.customers[customersIndex]);
          nextStep.customers.push(
            JSON.stringify({
              customerID: customerTimestampTuple.customerID,
              timestamp: Temporal.Now.instant().toString(),
            })
          );
        }
      }
      this.debug(
        `${JSON.stringify({
          waitUntilStep: waitUntilStep,
          forDeletion: forDeletion,
        })}`,
        this.handleWaitUntil.name,
        session
      );
      waitUntilStep.customers = waitUntilStep.customers.filter(
        (item) => !forDeletion.includes(item)
      );
      this.debug(
        `${JSON.stringify({ waitUntilStep: waitUntilStep })}`,
        this.handleWaitUntil.name,
        session
      );
      await queryRunner.manager.save(waitUntilStep);
      const newNext: Step = await queryRunner.manager.save(nextStep);
      this.debug(
        `${JSON.stringify({ newNext: newNext })}`,
        this.handleWaitUntil.name,
        session
      );
      if (
        forDeletion.length > 0 &&
        newNext.type !== StepType.TIME_DELAY &&
        newNext.type !== StepType.TIME_WINDOW &&
        newNext.type !== StepType.WAIT_UNTIL_BRANCH
      ) {
        this.transitionQueue.add(newNext.type, {
          ownerID,
          step: newNext,
          session: session,
        });
      }
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
    queryRunner: QueryRunner,
    transactionSession: mongoose.mongo.ClientSession
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
    queryRunner: QueryRunner,
    transactionSession: mongoose.mongo.ClientSession
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
    const nextStep = await queryRunner.manager.findOne(Step, {
      where: {
        id: currentStep.metadata.destination,
      },
      lock: { mode: 'pessimistic_write' },
    });

    for (let i = 0; i < currentStep.customers.length; i++) {
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
      ownerID,
      step: newNext,
      session: session,
    });
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
}
