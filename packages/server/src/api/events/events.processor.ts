import {
  Processor,
  WorkerHost,
  InjectQueue,
  OnWorkerEvent,
} from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { Account } from '../accounts/entities/accounts.entity';
import { CustomerDocument } from '../customers/schemas/customer.schema';
import { CustomersService } from '../customers/customers.service';
import { DataSource, QueryRunner } from 'typeorm';
import mongoose, { ClientSession } from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { Step } from '../steps/entities/step.entity';
import {
  AnalyticsProviderTypes,
  ElementConditionFilter,
  FilterByOption,
  StepType,
} from '../steps/types/step.interface';
import { Journey } from '../journeys/entities/journey.entity';
import { PosthogTriggerParams } from '../workflows/entities/workflow.entity';
import { AudiencesHelper } from '../audiences/audiences.helper';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { randomUUID } from 'crypto';
import { WebsocketGateway } from '@/websockets/websocket.gateway';
import * as _ from 'lodash';
import * as Sentry from '@sentry/node';
import { JourneyLocationsService } from '../journeys/journey-locations.service';

export enum EventType {
  EVENT = 'event',
  ATTRIBUTE = 'attribute_change',
  MESSAGE = 'email_message',
}

@Injectable()
@Processor('events', { removeOnComplete: { age: 0, count: 0 } })
export class EventsProcessor extends WorkerHost {
  private providerMap: Record<
    EventType,
    (
      job: Job<any, any, string>,
      queryRunner: QueryRunner,
      transactionSession: ClientSession,
      session: string
    ) => Promise<void>
  > = {
    [EventType.EVENT]: async (
      job,
      queryRunner,
      transactionSession,
      session
    ) => {
      await this.handleEvent(job, queryRunner, transactionSession, session);
    },
    [EventType.ATTRIBUTE]: async (
      job,
      queryRunner,
      transactionSession,
      session
    ) => {
      await this.handleAttributeChange(
        job,
        queryRunner,
        transactionSession,
        session
      );
    },
    [EventType.MESSAGE]: async (
      job,
      queryRunner,
      transactionSession,
      session
    ) => {
      await this.handleMessage(job, queryRunner, transactionSession, session);
    },
  };
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    private dataSource: DataSource,
    @InjectConnection() private readonly connection: mongoose.Connection,
    @Inject(CustomersService)
    private readonly customersService: CustomersService,
    private readonly audiencesHelper: AudiencesHelper,
    @Inject(WebsocketGateway)
    private websocketGateway: WebsocketGateway,
    @InjectQueue('transition') private readonly transitionQueue: Queue,
    @Inject(JourneyLocationsService)
    private readonly journeyLocationsService: JourneyLocationsService
  ) {
    super();
  }

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: EventsProcessor.name,
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
        class: EventsProcessor.name,
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
        class: EventsProcessor.name,
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
        class: EventsProcessor.name,
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
        class: EventsProcessor.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  async process(job: Job<any, any, string>): Promise<any> {
    const session = randomUUID();
    let err: any;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const transactionSession = await this.connection.startSession();
    await transactionSession.startTransaction();
    try {
      await this.providerMap[job.name](
        job,
        queryRunner,
        transactionSession,
        session
      );
    } catch (e) {
      this.error(e, this.process.name, job.data.session);
      err = e;
      await transactionSession.abortTransaction();
      await queryRunner.rollbackTransaction();
    } finally {
      await transactionSession.endSession();
      await queryRunner.release();
      if (err) throw err;
    }
  }

  async handleEvent(
    job: Job<any, any, string>,
    queryRunner: QueryRunner,
    transactionSession: ClientSession,
    session: string
  ): Promise<any> {
    let branch: number;
    const stepsToQueue: Step[] = [];
    //Account associated with event
    const account: Account = await queryRunner.manager.findOne(Account, {
      where: { id: job.data.accountID },
      relations: ['teams.organization.workspaces'],
    });
    // Multiple journeys can consume the same event, but only one step per journey,
    // so we create an event job for every journey
    const journey: Journey = await queryRunner.manager.findOneBy(Journey, {
      id: job.data.journeyID,
    });
    //Customer associated with event
    const customer: CustomerDocument =
      await this.customersService.findByCorrelationKVPair(
        account,
        job.data.event.correlationKey,
        job.data.event.correlationValue,
        session,
        transactionSession
      );
    //Have to take lock before you read the customers in the step, so before you read the step

    const location = await this.journeyLocationsService.findForWrite(
      journey,
      customer,
      session,
      account,
      queryRunner
    );

    if (!location) {
      this.warn(
        `${JSON.stringify({
          warning: 'Customer not in Journey',
          customer,
          journey,
        })}`,
        this.process.name,
        session,
        account.email
      );
      return;
    }

    await this.journeyLocationsService.lock(
      location,
      session,
      account,
      queryRunner
    );
    // All steps in `journey` that might be listening for this event
    const steps = (
      await queryRunner.manager.find(Step, {
        where: {
          type: StepType.WAIT_UNTIL_BRANCH,
          journey: { id: journey.id },
        },
        relations: ['workspace.organization.owner', 'journey'],
      })
    ).filter((el) => el?.metadata?.branches !== undefined);
    for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
      for (
        let branchIndex = 0;
        branchIndex < steps[stepIndex].metadata.branches.length;
        branchIndex++
      ) {
        const eventEvaluation: boolean[] = [];
        event_loop: for (
          let eventIndex = 0;
          eventIndex <
          steps[stepIndex].metadata.branches[branchIndex].events.length;
          eventIndex++
        ) {
          const analyticsEvent =
            steps[stepIndex].metadata.branches[branchIndex].events[eventIndex];
          if (job.data.event.source === AnalyticsProviderTypes.TRACKER) {
            eventEvaluation.push(
              job.data.event.event ===
                steps[stepIndex].metadata.branches[branchIndex].events[
                  eventIndex
                ].event &&
                job.data.event.payload.trackerId ==
                  steps[stepIndex].metadata.branches[branchIndex].events[
                    eventIndex
                  ].trackerID
            );
            continue event_loop;
          }
          // Special posthog handling: Skip over invalid posthog events
          if (
            job.data.event.source === AnalyticsProviderTypes.POSTHOG &&
            analyticsEvent.provider === AnalyticsProviderTypes.POSTHOG &&
            !(
              (job.data.event.payload.type === PosthogTriggerParams.Track &&
                job.data.event.event === 'change' &&
                analyticsEvent.event === PosthogTriggerParams.Typed) ||
              (job.data.event.payload.type === PosthogTriggerParams.Track &&
                job.data.event.event === 'click' &&
                analyticsEvent.event === PosthogTriggerParams.Autocapture) ||
              (job.data.event.payload.type === PosthogTriggerParams.Track &&
                job.data.event.event === 'submit' &&
                analyticsEvent.event === PosthogTriggerParams.Submit) ||
              (job.data.event.payload.type === PosthogTriggerParams.Track &&
                job.data.event.event === '$pageleave' &&
                analyticsEvent.event === PosthogTriggerParams.Pageleave) ||
              (job.data.event.payload.type === PosthogTriggerParams.Track &&
                job.data.event.event === '$rageclick' &&
                analyticsEvent.event === PosthogTriggerParams.Rageclick) ||
              (job.data.event.payload.type === PosthogTriggerParams.Page &&
                job.data.event.event === '$pageview' &&
                analyticsEvent.event === PosthogTriggerParams.Pageview) ||
              (job.data.event.payload.type === PosthogTriggerParams.Track &&
                job.data.event.event === analyticsEvent.event)
            )
          ) {
            eventEvaluation.push(false);
            continue event_loop;
          }

          //Skip over events that dont match
          if (
            job.data.event.source !== AnalyticsProviderTypes.POSTHOG &&
            analyticsEvent.provider !== AnalyticsProviderTypes.POSTHOG &&
            !(
              //allowing mobile events to also match here
              (
                (job.data.event.source === AnalyticsProviderTypes.MOBILE
                  ? AnalyticsProviderTypes.LAUDSPEAKER
                  : job.data.event.source) === analyticsEvent.provider &&
                job.data.event.event === analyticsEvent.event
              )
            )
          ) {
            eventEvaluation.push(false);
            continue event_loop;
          }
          this.warn(
            `${JSON.stringify({
              warning: 'Getting ready to loop over conditions',
              conditions: analyticsEvent.conditions,
              event: job.data.event,
            })}`,
            this.process.name,
            job.data.session
          );
          const conditionEvalutation: boolean[] = [];
          for (
            let conditionIndex = 0;
            conditionIndex <
            steps[stepIndex].metadata.branches[branchIndex].events[eventIndex]
              .conditions.length;
            conditionIndex++
          ) {
            this.warn(
              `${JSON.stringify({
                warning: 'Checking if we filter by event property',
                conditions: analyticsEvent.conditions[conditionIndex].type,
              })}`,
              this.process.name,
              job.data.session
            );
            if (
              analyticsEvent.conditions[conditionIndex].type ===
              FilterByOption.CUSTOMER_KEY
            ) {
              this.warn(
                `${JSON.stringify({
                  warning: 'Filtering by event property',
                  conditions: analyticsEvent.conditions[conditionIndex],
                  event: job.data.event,
                })}`,
                this.process.name,
                job.data.session
              );
              const { key, comparisonType, keyType, value } =
                analyticsEvent.conditions[conditionIndex].propertyCondition;
              //specialcase: checking for url
              if (
                key === 'current_url' &&
                analyticsEvent.provider === AnalyticsProviderTypes.POSTHOG &&
                analyticsEvent.event === PosthogTriggerParams.Pageview
              ) {
                const matches: boolean = ['exists', 'doesNotExist'].includes(
                  comparisonType
                )
                  ? this.audiencesHelper.operableCompare(
                      job.data.event?.payload?.context?.page?.url,
                      comparisonType
                    )
                  : await this.audiencesHelper.conditionalCompare(
                      job.data.event?.payload?.context?.page?.url,
                      value,
                      comparisonType
                    );
                conditionEvalutation.push(matches);
              } else {
                const matches = ['exists', 'doesNotExist'].includes(
                  comparisonType
                )
                  ? this.audiencesHelper.operableCompare(
                      job.data.event?.payload?.[key],
                      comparisonType
                    )
                  : await this.audiencesHelper.conditionalCompare(
                      job.data.event?.payload?.[key],
                      value,
                      comparisonType
                    );
                this.warn(
                  `${JSON.stringify({
                    checkMatchResult: matches,
                  })}`,
                  this.process.name,
                  job.data.session
                );
                conditionEvalutation.push(matches);
              }
            } else if (
              analyticsEvent.conditions[conditionIndex].type ===
              FilterByOption.ELEMENTS
            ) {
              const { order, filter, comparisonType, filterType, value } =
                analyticsEvent.conditions[conditionIndex].elementCondition;
              const elementToCompare = job.data.event?.event?.elements?.find(
                (el) => el?.order === order
              )?.[filter === ElementConditionFilter.TEXT ? 'text' : 'tag_name'];
              const matches: boolean =
                await this.audiencesHelper.conditionalCompare(
                  elementToCompare,
                  value,
                  comparisonType
                );
              conditionEvalutation.push(matches);
            }
          }
          // If Analytics event conditions are grouped by or, check if any of the conditions match
          if (
            steps[stepIndex].metadata.branches[branchIndex].events[eventIndex]
              .relation === 'or'
          ) {
            this.warn(
              `${JSON.stringify({
                warning: 'Checking if any event conditions match',
                conditions:
                  steps[stepIndex].metadata.branches[branchIndex].events,
                event: job.data.event,
              })}`,
              this.process.name,
              job.data.session
            );
            if (
              conditionEvalutation.some((element) => {
                return element === true;
              })
            ) {
              eventEvaluation.push(true);
            } else eventEvaluation.push(false);
          }
          // Otherwise,check if all of the events match
          else {
            this.warn(
              `${JSON.stringify({
                warning: 'Checking if all event conditions match',
                conditions:
                  steps[stepIndex].metadata.branches[branchIndex].events,
                event: job.data.event,
              })}`,
              this.process.name,
              job.data.session
            );
            if (
              conditionEvalutation.every((element) => {
                return element === true;
              })
            ) {
              eventEvaluation.push(true);
            } else eventEvaluation.push(false);
          }
        }
        // If branch events are grouped by or,check if any of the events match
        if (steps[stepIndex].metadata.branches[branchIndex].relation === 'or') {
          this.warn(
            `${JSON.stringify({
              warning: 'Checking if any branch events match',
              branches: steps[stepIndex].metadata.branches,
              event: job.data.event,
            })}`,
            this.process.name,
            job.data.session
          );
          if (
            eventEvaluation.some((element) => {
              return element === true;
            })
          ) {
            stepsToQueue.push(steps[stepIndex]);
            branch = branchIndex;
            // break step_loop;
          }
        }
        // Otherwise,check if all of the events match
        else {
          this.warn(
            `${JSON.stringify({
              warning: 'Checking if all branch events match',
              branches: steps[stepIndex].metadata.branches,
              event: job.data.event,
            })}`,
            this.process.name,
            job.data.session
          );
          if (
            eventEvaluation.every((element) => {
              return element === true;
            })
          ) {
            stepsToQueue.push(steps[stepIndex]);
            branch = branchIndex;
            // break step_loop;
          }
        }
      }
    }

    // If customer isn't in step, we throw error, otherwise we queue and consume event
    if (stepsToQueue.length) {
      let stepToQueue: Step;
      for (let i = 0; i < stepsToQueue.length; i++) {
        if (String(location.step) === stepsToQueue[i].id) {
          stepToQueue = stepsToQueue[i];
          break;
        }
      }
      if (stepToQueue) {
        await this.transitionQueue.add(stepToQueue.type, {
          step: stepToQueue,
          branch: branch,
          customerID: customer.id,
          ownerID: stepToQueue.workspace.organization.owner.id,
          session: job.data.session,
          journeyID: journey.id,
          event: job.data.event.event,
        });
      } else {
        await this.journeyLocationsService.unlock(
          location,
          session,
          account,
          queryRunner
        );
        this.warn(
          `${JSON.stringify({
            warning: 'Customer not in step',
            customerID: customer.id,
            stepToQueue,
          })}`,
          this.process.name,
          session,
          account.email
        );
        // Acknowledge that event is finished processing to frontend if its
        // a tracker event
        if (job.data.event.source === AnalyticsProviderTypes.TRACKER) {
          await this.websocketGateway.sendProcessed(
            customer.id,
            job.data.event.event,
            job.data.event.payload.trackerId
          );
        }
        return;
      }
    } else {
      await this.journeyLocationsService.unlock(
        location,
        session,
        account,
        queryRunner
      );
      this.warn(
        `${JSON.stringify({ warning: 'No step matches event' })}`,
        this.process.name,
        session,
        account.email
      );
      if (job.data.event.source === AnalyticsProviderTypes.TRACKER) {
        await this.websocketGateway.sendProcessed(
          customer.id,
          job.data.event.event,
          job.data.event.payload.trackerId
        );
      }
      return;
    }
    return;
  }

  async handleAttributeChange(
    job: Job<any, any, string>,
    queryRunner: QueryRunner,
    transactionSession: ClientSession,
    session: string
  ): Promise<any> {
    let branch: number;
    const stepsToQueue: Step[] = [];
    //Account associated with event
    const account: Account = await queryRunner.manager.findOne(Account, {
      where: { id: job.data.accountID },
      relations: ['teams.organization.workspaces'],
    });
    const journey: Journey = await queryRunner.manager.findOneBy(Journey, {
      id: job.data.journeyID,
    });
    //Customer associated with event
    const customer: CustomerDocument = await this.customersService.findById(
      account,
      job.data.customer,
      transactionSession
    );
    //Have to take lock before you read the customers in the step, so before you read the step

    const location = await this.journeyLocationsService.findForWrite(
      journey,
      customer,
      session,
      account,
      queryRunner
    );

    if (!location) {
      this.warn(
        `${JSON.stringify({
          warning: 'Customer not in Journey',
          customer,
          journey,
        })}`,
        this.process.name,
        session,
        account.email
      );
      return;
    }

    await this.journeyLocationsService.lock(
      location,
      session,
      account,
      queryRunner
    );
    // All steps in `journey` that might be listening for this event
    const steps = (
      await queryRunner.manager.find(Step, {
        where: {
          type: StepType.WAIT_UNTIL_BRANCH,
          journey: { id: journey.id },
        },
        relations: ['workspace.organization.owner', 'journey'],
      })
    ).filter((el) => el?.metadata?.branches !== undefined);
    for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
      for (
        let branchIndex = 0;
        branchIndex < steps[stepIndex].metadata.branches.length;
        branchIndex++
      ) {
        const eventEvaluation: boolean[] = [];
        for (
          let eventIndex = 0;
          eventIndex <
          steps[stepIndex].metadata.branches[branchIndex].events.length;
          eventIndex++
        ) {
          const attributeEvent =
            steps[stepIndex].metadata.branches[branchIndex].events[eventIndex];

          //Case 1: changed
          if (attributeEvent.happenCondition === 'changed') {
            if (job.data.fields?.[attributeEvent.attributeName]) {
              eventEvaluation.push(true);
            } else {
              eventEvaluation.push(false);
            }
          }
          //Case 2: changed to
          else if (attributeEvent.happenCondition === 'changed to') {
            if (
              job.data.fields?.[attributeEvent.attributeName] ===
              attributeEvent.value
            ) {
              eventEvaluation.push(true);
            } else {
              eventEvaluation.push(false);
            }
          } else {
            eventEvaluation.push(false);
          }
        }
        // If branch events are grouped by or,check if any of the events match
        if (steps[stepIndex].metadata.branches[branchIndex].relation === 'or') {
          this.warn(
            `${JSON.stringify({
              warning: 'Checking if any branch events match',
              branches: steps[stepIndex].metadata.branches,
              event: job.data.event,
            })}`,
            this.process.name,
            job.data.session
          );
          if (
            eventEvaluation.some((element) => {
              return element === true;
            })
          ) {
            stepsToQueue.push(steps[stepIndex]);
            branch = branchIndex;
            // break step_loop;
          }
        }
        // Otherwise,check if all of the events match
        else {
          this.warn(
            `${JSON.stringify({
              warning: 'Checking if all branch events match',
              branches: steps[stepIndex].metadata.branches,
              event: job.data.event,
            })}`,
            this.process.name,
            job.data.session
          );
          if (
            eventEvaluation.every((element) => {
              return element === true;
            })
          ) {
            stepsToQueue.push(steps[stepIndex]);
            branch = branchIndex;
            // break step_loop;
          }
        }
      }
    }

    // If customer isn't in step, we throw error, otherwise we queue and consume event
    if (stepsToQueue.length) {
      let stepToQueue;
      for (let i = 0; i < stepsToQueue.length; i++) {
        if (String(location.step) === stepsToQueue[i].id) {
          stepToQueue = stepsToQueue[i];
          break;
        }
      }
      if (stepToQueue) {
        await this.transitionQueue.add(stepToQueue.type, {
          step: stepToQueue,
          branch: branch,
          customerID: customer.id,
          ownerID: stepToQueue.workspace.organization.owner.id,
          session: job.data.session,
          journeyID: journey.id,
        });
      } else {
        await this.journeyLocationsService.unlock(
          location,
          session,
          account,
          queryRunner
        );
        this.warn(
          `${JSON.stringify({
            warning: 'Customer not in step',
            customerID: customer.id,
            stepToQueue,
          })}`,
          this.process.name,
          session,
          account.email
        );
        return;
      }
    } else {
      await this.journeyLocationsService.unlock(
        location,
        session,
        account,
        queryRunner
      );
      this.warn(
        `${JSON.stringify({ warning: 'No step matches event' })}`,
        this.process.name,
        session,
        account.email
      );
      return;
    }
    return;
  }

  async handleMessage(
    job: Job<any, any, string>,
    queryRunner: QueryRunner,
    transactionSession: ClientSession,
    session: string
  ): Promise<any> {
    let branch: number;
    const stepsToQueue: Step[] = [];

    //Account associated with event
    const account: Account = await queryRunner.manager.findOneBy(Account, {
      id: job.data.accountID,
    });
    // Multiple journeys can consume the same event, but only one step per journey,
    // so we create an event job for every journey
    const journey: Journey = await queryRunner.manager.findOneBy(Journey, {
      id: job.data.journeyID,
    });
    //Customer associated with event
    const customer: CustomerDocument = await this.customersService.findById(
      account,
      job.data.customer,
      transactionSession
    );

    //Have to take lock before you read the customers in the step, so before you read the step

    const location = await this.journeyLocationsService.findForWrite(
      journey,
      customer,
      job.data.session,
      account,
      queryRunner
    );

    if (!location) {
      this.warn(
        `${JSON.stringify({
          warning: 'Customer not in Journey',
          customer,
          journey,
        })}`,
        this.process.name,
        job.data.session,
        account.email
      );
      return;
    }

    await this.journeyLocationsService.lock(
      location,
      job.data.session,
      account,
      queryRunner
    );
    // All steps in `journey` that might be listening for this event
    const steps = (
      await queryRunner.manager.find(Step, {
        where: {
          type: StepType.WAIT_UNTIL_BRANCH,
          journey: { id: journey.id },
        },
        relations: ['owner', 'journey'],
      })
    ).filter((el) => el?.metadata?.branches !== undefined);
    for (let stepIndex = 0; stepIndex < steps.length; stepIndex++) {
      for (
        let branchIndex = 0;
        branchIndex < steps[stepIndex].metadata.branches.length;
        branchIndex++
      ) {
        const eventEvaluation: boolean[] = [];
        event_loop: for (
          let eventIndex = 0;
          eventIndex <
          steps[stepIndex].metadata.branches[branchIndex].events.length;
          eventIndex++
        ) {
          const analyticsEvent =
            steps[stepIndex].metadata.branches[branchIndex].events[eventIndex];
          if (job.data.event.source === AnalyticsProviderTypes.TRACKER) {
            eventEvaluation.push(
              job.data.event.event ===
                steps[stepIndex].metadata.branches[branchIndex].events[
                  eventIndex
                ].event &&
                job.data.event.payload.trackerId ==
                  steps[stepIndex].metadata.branches[branchIndex].events[
                    eventIndex
                  ].trackerID
            );
            continue event_loop;
          }
          // Special posthog handling: Skip over invalid posthog events
          if (
            job.data.event.source === AnalyticsProviderTypes.POSTHOG &&
            analyticsEvent.provider === AnalyticsProviderTypes.POSTHOG &&
            !(
              (job.data.event.payload.type === PosthogTriggerParams.Track &&
                job.data.event.event === 'change' &&
                analyticsEvent.event === PosthogTriggerParams.Typed) ||
              (job.data.event.payload.type === PosthogTriggerParams.Track &&
                job.data.event.event === 'click' &&
                analyticsEvent.event === PosthogTriggerParams.Autocapture) ||
              (job.data.event.payload.type === PosthogTriggerParams.Track &&
                job.data.event.event === 'submit' &&
                analyticsEvent.event === PosthogTriggerParams.Submit) ||
              (job.data.event.payload.type === PosthogTriggerParams.Track &&
                job.data.event.event === '$pageleave' &&
                analyticsEvent.event === PosthogTriggerParams.Pageleave) ||
              (job.data.event.payload.type === PosthogTriggerParams.Track &&
                job.data.event.event === '$rageclick' &&
                analyticsEvent.event === PosthogTriggerParams.Rageclick) ||
              (job.data.event.payload.type === PosthogTriggerParams.Page &&
                job.data.event.event === '$pageview' &&
                analyticsEvent.event === PosthogTriggerParams.Pageview) ||
              (job.data.event.payload.type === PosthogTriggerParams.Track &&
                job.data.event.event === analyticsEvent.event)
            )
          ) {
            eventEvaluation.push(false);
            continue event_loop;
          }

          //Skip over events that dont match
          if (
            job.data.event.source !== AnalyticsProviderTypes.POSTHOG &&
            analyticsEvent.provider !== AnalyticsProviderTypes.POSTHOG &&
            !(
              job.data.event.source === analyticsEvent.provider &&
              job.data.event.event === analyticsEvent.event
            )
          ) {
            eventEvaluation.push(false);
            continue event_loop;
          }
          this.warn(
            `${JSON.stringify({
              warning: 'Getting ready to loop over conditions',
              conditions: analyticsEvent.conditions,
              event: job.data.event,
            })}`,
            this.process.name,
            job.data.session
          );
          const conditionEvalutation: boolean[] = [];
          for (
            let conditionIndex = 0;
            conditionIndex <
            steps[stepIndex].metadata.branches[branchIndex].events[eventIndex]
              .conditions.length;
            conditionIndex++
          ) {
            this.warn(
              `${JSON.stringify({
                warning: 'Checking if we filter by event property',
                conditions: analyticsEvent.conditions[conditionIndex].type,
              })}`,
              this.process.name,
              job.data.session
            );
            if (
              analyticsEvent.conditions[conditionIndex].type ===
              FilterByOption.CUSTOMER_KEY
            ) {
              this.warn(
                `${JSON.stringify({
                  warning: 'Filtering by event property',
                  conditions: analyticsEvent.conditions[conditionIndex],
                  event: job.data.event,
                })}`,
                this.process.name,
                job.data.session
              );
              const { key, comparisonType, keyType, value } =
                analyticsEvent.conditions[conditionIndex].propertyCondition;
              //specialcase: checking for url
              if (
                key === 'current_url' &&
                analyticsEvent.provider === AnalyticsProviderTypes.POSTHOG &&
                analyticsEvent.event === PosthogTriggerParams.Pageview
              ) {
                const matches: boolean = ['exists', 'doesNotExist'].includes(
                  comparisonType
                )
                  ? this.audiencesHelper.operableCompare(
                      job.data.event?.payload?.context?.page?.url,
                      comparisonType
                    )
                  : await this.audiencesHelper.conditionalCompare(
                      job.data.event?.payload?.context?.page?.url,
                      value,
                      comparisonType
                    );
                conditionEvalutation.push(matches);
              } else {
                const matches = ['exists', 'doesNotExist'].includes(
                  comparisonType
                )
                  ? this.audiencesHelper.operableCompare(
                      job.data.event?.payload?.[key],
                      comparisonType
                    )
                  : await this.audiencesHelper.conditionalCompare(
                      job.data.event?.payload?.[key],
                      value,
                      comparisonType
                    );
                this.warn(
                  `${JSON.stringify({
                    checkMatchResult: matches,
                  })}`,
                  this.process.name,
                  job.data.session
                );
                conditionEvalutation.push(matches);
              }
            } else if (
              analyticsEvent.conditions[conditionIndex].type ===
              FilterByOption.ELEMENTS
            ) {
              const { order, filter, comparisonType, filterType, value } =
                analyticsEvent.conditions[conditionIndex].elementCondition;
              const elementToCompare = job.data.event?.event?.elements?.find(
                (el) => el?.order === order
              )?.[filter === ElementConditionFilter.TEXT ? 'text' : 'tag_name'];
              const matches: boolean =
                await this.audiencesHelper.conditionalCompare(
                  elementToCompare,
                  value,
                  comparisonType
                );
              conditionEvalutation.push(matches);
            }
          }
          // If Analytics event conditions are grouped by or, check if any of the conditions match
          if (
            steps[stepIndex].metadata.branches[branchIndex].events[eventIndex]
              .relation === 'or'
          ) {
            this.warn(
              `${JSON.stringify({
                warning: 'Checking if any event conditions match',
                conditions:
                  steps[stepIndex].metadata.branches[branchIndex].events,
                event: job.data.event,
              })}`,
              this.process.name,
              job.data.session
            );
            if (
              conditionEvalutation.some((element) => {
                return element === true;
              })
            ) {
              eventEvaluation.push(true);
            } else eventEvaluation.push(false);
          }
          // Otherwise,check if all of the events match
          else {
            this.warn(
              `${JSON.stringify({
                warning: 'Checking if all event conditions match',
                conditions:
                  steps[stepIndex].metadata.branches[branchIndex].events,
                event: job.data.event,
              })}`,
              this.process.name,
              job.data.session
            );
            if (
              conditionEvalutation.every((element) => {
                return element === true;
              })
            ) {
              eventEvaluation.push(true);
            } else eventEvaluation.push(false);
          }
        }
        // If branch events are grouped by or,check if any of the events match
        if (steps[stepIndex].metadata.branches[branchIndex].relation === 'or') {
          this.warn(
            `${JSON.stringify({
              warning: 'Checking if any branch events match',
              branches: steps[stepIndex].metadata.branches,
              event: job.data.event,
            })}`,
            this.process.name,
            job.data.session
          );
          if (
            eventEvaluation.some((element) => {
              return element === true;
            })
          ) {
            stepsToQueue.push(steps[stepIndex]);
            branch = branchIndex;
            // break step_loop;
          }
        }
        // Otherwise,check if all of the events match
        else {
          this.warn(
            `${JSON.stringify({
              warning: 'Checking if all branch events match',
              branches: steps[stepIndex].metadata.branches,
              event: job.data.event,
            })}`,
            this.process.name,
            job.data.session
          );
          if (
            eventEvaluation.every((element) => {
              return element === true;
            })
          ) {
            stepsToQueue.push(steps[stepIndex]);
            branch = branchIndex;
            // break step_loop;
          }
        }
      }
    }

    // If customer isn't in step, we throw error, otherwise we queue and consume event
    if (stepsToQueue.length) {
      let stepToQueue;
      for (let i = 0; i < stepsToQueue.length; i++) {
        if (String(location.step) === stepsToQueue[i].id) {
          stepToQueue = stepsToQueue[i];
          break;
        }
      }
      if (stepToQueue) {
        await this.transitionQueue.add(stepToQueue.type, {
          step: stepToQueue,
          branch: branch,
          customerID: customer.id,
          ownerID: stepToQueue.owner.id,
          session: job.data.session,
          journeyID: journey.id,
          event: job.data.event.event,
        });
      } else {
        await this.journeyLocationsService.unlock(
          location,
          job.data.session,
          account,
          queryRunner
        );
        this.warn(
          `${JSON.stringify({
            warning: 'Customer not in step',
            customerID: customer.id,
            stepToQueue,
          })}`,
          this.process.name,
          job.data.session,
          account.email
        );
        // Acknowledge that event is finished processing to frontend if its
        // a tracker event
        if (job.data.event.source === AnalyticsProviderTypes.TRACKER) {
          await this.websocketGateway.sendProcessed(
            customer.id,
            job.data.event.event,
            job.data.event.payload.trackerId
          );
        }
        return;
      }
    } else {
      await this.journeyLocationsService.unlock(
        location,
        job.data.session,
        account,
        queryRunner
      );
      this.warn(
        `${JSON.stringify({ warning: 'No step matches event' })}`,
        this.process.name,
        job.data.session,
        account.email
      );
      if (job.data.event.source === AnalyticsProviderTypes.TRACKER) {
        await this.websocketGateway.sendProcessed(
          customer.id,
          job.data.event.event,
          job.data.event.payload.trackerId
        );
      }
      return;
    }
    return;
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error, prev?: string) {
    Sentry.withScope((scope) => {
      scope.setTag('job_id', job.id);
      scope.setTag('processor', EventsProcessor.name);
      Sentry.captureException(error);
    });
  }
}
