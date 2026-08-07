import {
  OnWorkerEvent,
} from '@nestjs/bullmq';
import { Job, MetricsTime, Queue, UnrecoverableError } from 'bullmq';
import { Inject, Injectable, Logger, forwardRef } from '@nestjs/common';
import { Account } from '../../accounts/entities/accounts.entity';
import { CustomersService } from '../../customers/customers.service';
import { DataSource, Repository } from 'typeorm';
import { Step } from '../../steps/entities/step.entity';
import {
  AnalyticsProviderTypes,
  ElementConditionFilter,
  FilterByOption,
  MessageEvent,
  StepType,
} from '../../steps/types/step.interface';
import { Journey } from '../../journeys/entities/journey.entity';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { WebsocketGateway } from '../../../websockets/websocket.gateway';
import * as _ from 'lodash';
import * as Sentry from '@sentry/node';
import { JourneyLocationsService } from '../../journeys/journey-locations.service';
import { InjectRepository } from '@nestjs/typeorm';
import { CacheService } from '../../../common/services/cache.service';
import { Processor } from '../../../common/services/queue/decorators/processor';
import { ProcessorBase } from '../../../common/services/queue/classes/processor-base';
import { QueueType } from '../../../common/services/queue/types/queue-type';
import { Producer } from '../../../common/services/queue/classes/producer';
import { StepsHelper } from '../../../api/steps/steps.helper';
import { Customer } from '../../../api/customers/entities/customer.entity';
import { CacheConstants } from '../../../common/services/cache.constants';

export enum EventType {
  EVENT = 'event',
  ATTRIBUTE = 'attribute_change',
  MESSAGE = 'message',
}
export enum PosthogTriggerParams {
  Track = 'track',
  Page = 'page',
  Rageclick = 'Rageclick',
  Typed = 'Typed (Change)',
  Autocapture = 'Autocapture (Click)',
  Submit = 'Submit',
  Pageview = 'Pageview',
  Pageleave = 'Pageleave',
}

/**
 * EventsProcessor is a worker class responsible for processing events.
 * For every event/journey/customer combination, it looks up all the
 * Wait Until steps in the Journey, checks if the step defintion matches
 * the event, checks if the customer is in that step, and adds a job to
 * the wait_until queue if necessary. It then passes the event/customer
 * combination to the EventPostProcessor to update Journey and Segment
 * enrollment for that customer.
 */
@Injectable()
@Processor(
  'events', {
  maxRetries: {
    count: Number.MAX_SAFE_INTEGER,
    delayMS: 1000
  }
})
export class EventsProcessor extends ProcessorBase {
  private providerMap: Record<
    EventType,
    (job: Job<any, any, string>) => Promise<void>
  > = {
      [EventType.EVENT]: this.handleEvent,
      [EventType.ATTRIBUTE]: this.handleAttributeChange,
      [EventType.MESSAGE]: this.handleMessage,
    };
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    private dataSource: DataSource,
    @Inject(forwardRef(() => CustomersService))
    private readonly customersService: CustomersService,
    private readonly stepsHelper: StepsHelper,
    @Inject(forwardRef(() => WebsocketGateway))
    private websocketGateway: WebsocketGateway,
    @Inject(JourneyLocationsService)
    private readonly journeyLocationsService: JourneyLocationsService,
    @InjectRepository(Step) private readonly stepsRepository: Repository<Step>,
    @Inject(CacheService) private cacheService: CacheService
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
    let err: any;
    try {
      const fn = this.providerMap[job.name];
      const that = this;

      return Sentry.startSpan(
        { name: `EventsProcessor.${fn.name}` },
        async () => {
          await fn.call(that, job);
        }
      );
    } catch (e) {
      this.error(e, this.process.name, job.data.session);
      err = e;
    } finally {
      if (err?.code === 'CUSTOMER_STILL_MOVING') {
        throw err;
      } else if (err) {
        throw new UnrecoverableError(err.message);
      }
    }
  }

  async handleEvent(
    job: Job<
      {
        account: Account;
        //workspace: Workspace;
        journey: Journey;
        customer: Customer;
        event: any;
        session: string;
      },
      any,
      string
    >
  ): Promise<any> {
    let branch: number;
    const stepsToQueue: Step[] = [];

    const location = await this.journeyLocationsService.findForWrite(
      job.data.journey.id,
      job.data.customer.id,
      job.data.account.teams?.[0]?.organization?.workspaces?.[0].id
    );

    if (!location) {
      this.warn(
        `${JSON.stringify({
          warning: 'Customer not in Journey',
          customer: job.data.customer,
          journey: job.data.journey,
        })}`,
        this.process.name,
        job.data.session,
        job.data.account.email
      );
      return;
    }

    await this.journeyLocationsService.lock(
      location,
      job.data.session,
      job.data.account
    );
    // All steps in `journey` that might be listening for this event
    const steps = await this.cacheService.get(
      CacheConstants.WAIT_UNTIL_STEPS,
      job.data.journey.id,
      async () => {
        return (
          await this.stepsRepository.find({
            where: {
              type: StepType.WAIT_UNTIL_BRANCH,
              journey: { id: job.data.journey.id },
            },
          })
        ).filter((el) => el?.metadata?.branches !== undefined);
      }
    );

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
                  ? this.stepsHelper.operableCompare(
                      job.data.event?.payload?.context?.page?.url,
                      comparisonType
                    )
                  : await this.stepsHelper.conditionalCompare(
                      job.data.event?.payload?.context?.page?.url,
                      value,
                      comparisonType
                    );
                conditionEvalutation.push(matches);
              } else {
                const matches = ['exists', 'doesNotExist'].includes(
                  comparisonType
                )
                  ? this.stepsHelper.operableCompare(
                      job.data.event?.payload?.[key],
                      comparisonType
                    )
                  : await this.stepsHelper.conditionalCompare(
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
                await this.stepsHelper.conditionalCompare(
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
        if (String(location.step_id) === stepsToQueue[i].id) {
          stepToQueue = stepsToQueue[i];
          break;
        }
      }
      if (stepToQueue) {
        await Producer.add(QueueType.WAIT_UNTIL_STEP, {
          step: stepToQueue,
          branch: branch,
          customer: job.data.customer,
          owner: job.data.account, //stepToQueue.workspace.organization.owner.id,
          location,
          session: job.data.session,
          journey: job.data.journey,
          event: job.data.event.event,
        }, stepToQueue.type);
      } else {
        await this.journeyLocationsService.unlock(location, location.step_id);
        this.warn(
          `${JSON.stringify({
            warning: 'Customer not in step',
            customerID: job.data.customer.id,
            stepToQueue,
          })}`,
          this.process.name,
          job.data.session,
          job.data.account.email
        );
        // Acknowledge that event is finished processing to frontend if its
        // a tracker event
        if (job.data.event.source === AnalyticsProviderTypes.TRACKER) {
          await this.websocketGateway.sendProcessed(
            job.data.customer.id.toString(),
            job.data.event.event,
            job.data.event.payload.trackerId
          );
        }
        return;
      }
    } else {
      await this.journeyLocationsService.unlock(location, location.step_id);
      this.warn(
        `${JSON.stringify({ warning: 'No step matches event' })}`,
        this.process.name,
        job.data.session,
        job.data.account.email
      );
      if (job.data.event.source === AnalyticsProviderTypes.TRACKER) {
        await this.websocketGateway.sendProcessed(
          job.data.customer.id.toString(),
          job.data.event.event,
          job.data.event.payload.trackerId
        );
      }
      return;
    }
    return;
  }

  async handleAttributeChange(job: Job<any, any, string>): Promise<any> {
    /*
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
        if (String(location.step_id) === stepsToQueue[i].id) {
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
        await this.journeyLocationsService.unlock(location, location.step_id);
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
      await this.journeyLocationsService.unlock(location, location.step_id);
      this.warn(
        `${JSON.stringify({ warning: 'No step matches event' })}`,
        this.process.name,
        session,
        account.email
      );
      return;
    }
    return;
    */
  }

  async handleMessage(job: Job<any, any, string>): Promise<any> {
    let branch: number;
    const stepsToQueue: Step[] = [];

    const location = await this.journeyLocationsService.findForWrite(
      job.data.journey.id,
      job.data.customer.id,
      job.data.account.teams?.[0]?.organization?.workspaces?.[0].id
    );

    if (!location) {
      return;
    }

    await this.journeyLocationsService.lock(
      location,
      job.data.session,
      job.data.account
    );
    // All steps in `journey` that might be listening for this event
    const steps = await this.cacheService.get(
      CacheConstants.WAIT_UNTIL_STEPS,
      job.data.journey.id,
      async () => {
        return (
          await this.stepsRepository.find({
            where: {
              type: StepType.WAIT_UNTIL_BRANCH,
              journey: { id: job.data.journey.id },
            },
          })
        ).filter((el) => el?.metadata?.branches !== undefined);
      }
    );


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
          const messageEvent: MessageEvent =
            steps[stepIndex].metadata.branches[branchIndex].events[eventIndex];
          //Skip events that arent message events
          if ((messageEvent.providerType !== "email_message") && (messageEvent.providerType !== "sms_message") && (messageEvent.providerType !== "push_message"))
            continue;
          // Check if the other fields match first
          if (messageEvent.eventCondition !== job.data.message.event || messageEvent.journey !== job.data.step.journeyId) {
            eventEvaluation.push(false);
            continue;
          }
          //Case 1: any message of a particular type in a journey
          if (messageEvent.step === 'ANY') {
            eventEvaluation.push(true);
            continue;
          }
          //Case 2: Particular step
          else {
            //Case 2a. Steps match
            if (messageEvent.step === job.data.message.stepId) {
              eventEvaluation.push(true);
              continue;
              //Case 2b. steps dont match
            } else {
              eventEvaluation.push(false);
              continue;
            }
          }
        }
        // If branch events are grouped by or,check if any of the events match
        if (steps[stepIndex].metadata.branches[branchIndex].relation === 'or') {
          if (
            eventEvaluation.some((element) => {
              return element === true;
            })
          ) {
            stepsToQueue.push(steps[stepIndex]);
            branch = branchIndex;
          }
        }
        // Otherwise,check if all of the events match
        else {
          if (
            eventEvaluation.every((element) => {
              return element === true;
            })
          ) {
            stepsToQueue.push(steps[stepIndex]);
            branch = branchIndex;
          }
        }
      }
    }

    if (stepsToQueue.length) {
      let stepToQueue: Step;
      for (let i = 0; i < stepsToQueue.length; i++) {
        if (String(location.step_id) === stepsToQueue[i].id) {
          stepToQueue = stepsToQueue[i];
          break;
        }
      }
      if (stepToQueue) {
        await Producer.add(QueueType.WAIT_UNTIL_STEP, {
          step: stepToQueue,
          branch: branch,
          customer: job.data.customer,
          owner: job.data.account,
          location,
          session: job.data.session,
          journey: job.data.journey,
          event: job.data.message.event,
        }, stepToQueue.type);
      } else {
        await this.journeyLocationsService.unlock(location, location.step_id);
        return;
      }
    } else {
      await this.journeyLocationsService.unlock(location, location.step_id);
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
