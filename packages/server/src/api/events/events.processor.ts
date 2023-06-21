import { InjectQueue, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Injectable } from '@nestjs/common';
import { Job, Queue } from 'bullmq';
import { Account } from '../accounts/entities/accounts.entity';
import { EventDto } from './dto/event.dto';
import { PosthogBatchEventDto } from './dto/posthog-batch-event.dto';
import { CustomerDocument } from '../customers/schemas/customer.schema';
import { CustomersService } from '../customers/customers.service';
import { DataSource } from 'typeorm';
import mongoose from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { Step } from '../steps/entities/step.entity';
import {
  AnalyticsEvent,
  AnalyticsProviderTypes,
  ElementConditionFilter,
  FilterByOption,
  StepType,
} from '../steps/types/step.interface';
import { Journey } from '../journeys/entities/journey.entity';
import {
  PosthogTriggerParams,
  ProviderTypes,
} from '../workflows/entities/workflow.entity';
import { AudiencesHelper } from '../audiences/audiences.helper';

export interface StartDto {
  account: Account;
  workflowID: string;
}

export interface CustomEventDto {
  apiKey: string;
  eventDto: EventDto;
}

export interface PosthogEventDto {
  apiKey: string;
  eventDto: PosthogBatchEventDto;
}

@Injectable()
@Processor('events')
export class EventsProcessor extends WorkerHost {
  constructor(
    private dataSource: DataSource,
    @InjectConnection() private readonly connection: mongoose.Connection,
    @Inject(CustomersService)
    private readonly customersService: CustomersService,
    @InjectQueue('transition') private readonly transitionQueue: Queue,
    private readonly audiencesHelper: AudiencesHelper
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    let err: any, stepToQueue: Step, branch: number;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    const transactionSession = await this.connection.startSession();
    await transactionSession.startTransaction();
    try {
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
      const customer: CustomerDocument =
        await this.customersService.findByCorrelationKVPair(
          account,
          job.data.event.correlationKey,
          job.data.event.correlationValue,
          transactionSession
        );
      // All steps in `journey` that might be listening for this event
      const steps = await queryRunner.manager.find(Step, {
        where: {
          type: StepType.WAIT_UNTIL_BRANCH,
          journey: { id: journey.id },
        },
      });

      step_loop: for (
        let stepIndex = 0;
        stepIndex < steps.length;
        stepIndex++
      ) {
        branch_loop: for (
          let branchIndex = 0;
          branchIndex < steps[stepIndex].metadata.branches.length;
          branchIndex++
        ) {
          let eventEvaluation: boolean[] = [];
          event_loop: for (
            let eventIndex = 0;
            eventIndex <
            steps[stepIndex].metadata.branches[branchIndex].events.length;
            eventIndex++
          ) {
            // Skip over invalid posthog events
            const analyticsEvent: AnalyticsEvent =
              steps[stepIndex].metadata.branches[branchIndex].events[
                eventIndex
              ];
            if (
              job.data.event.source === AnalyticsProviderTypes.POSTHOG &&
              analyticsEvent.provider === AnalyticsProviderTypes.POSTHOG &&
              !(
                (job.data.event.payload.type === PosthogTriggerParams.Track &&
                  job.data.event.payload.event === 'change' &&
                  analyticsEvent.event === PosthogTriggerParams.Typed) ||
                (job.data.event.payload.type === PosthogTriggerParams.Track &&
                  job.data.event.payload.event === 'click' &&
                  analyticsEvent.event === PosthogTriggerParams.Autocapture) ||
                (job.data.event.payload.type === PosthogTriggerParams.Track &&
                  job.data.event.payload.event === 'submit' &&
                  analyticsEvent.event === PosthogTriggerParams.Submit) ||
                (job.data.event.payload.type === PosthogTriggerParams.Track &&
                  job.data.event.payload.event === '$pageleave' &&
                  analyticsEvent.event === PosthogTriggerParams.Pageleave) ||
                (job.data.event.payload.type === PosthogTriggerParams.Track &&
                  job.data.event.payload.event === '$rageclick' &&
                  analyticsEvent.event === PosthogTriggerParams.Rageclick) ||
                (job.data.event.payload.type === PosthogTriggerParams.Page &&
                  job.data.event.payload.event === '$pageview' &&
                  analyticsEvent.event === PosthogTriggerParams.Pageview) ||
                (job.data.event.payload.type === PosthogTriggerParams.Track &&
                  job.data.event.payload.event === analyticsEvent.event)
              )
            ) {
              eventEvaluation.push(false);
              continue event_loop;
            }

            //Skip over custom events that dont match
            if (
              job.data.event.source === ProviderTypes.Custom &&
              analyticsEvent.provider === AnalyticsProviderTypes.LAUDSPEAKER &&
              !(job.data.event.payload.event === analyticsEvent.event)
            ) {
              eventEvaluation.push(false);
              continue event_loop;
            }
            let conditionEvalutation: boolean[] = [];
            condition_loop: for (
              let conditionIndex = 0;
              conditionIndex <
              steps[stepIndex].metadata.branches[branchIndex].events[eventIndex]
                .length;
              conditionIndex++
            ) {
              if (
                analyticsEvent.conditions[conditionIndex].type ===
                FilterByOption.CUSTOMER_KEY
              ) {
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
                        job.data.event?.event?.page?.url,
                        comparisonType
                      )
                    : await this.audiencesHelper.conditionalCompare(
                        job.data.event?.event?.page?.url,
                        value,
                        comparisonType
                      );
                  conditionEvalutation.push(matches);
                } else {
                  const matches = ['exists', 'doesNotExist'].includes(
                    comparisonType
                  )
                    ? this.audiencesHelper.operableCompare(
                        job.data.event?.event?.[key],
                        comparisonType
                      )
                    : await this.audiencesHelper.conditionalCompare(
                        job.data.event?.event?.[key],
                        value,
                        comparisonType
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
                )?.[
                  filter === ElementConditionFilter.TEXT ? 'text' : 'tag_name'
                ];
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
          if (
            steps[stepIndex].metadata.branches[branchIndex].relation === 'or'
          ) {
            if (
              eventEvaluation.some((element) => {
                return element === true;
              })
            ) {
              stepToQueue = steps[stepIndex];
              branch = branchIndex;
              break step_loop;
            }
          }
          // Otherwise,check if all of the events match
          else {
            if (
              eventEvaluation.every((element) => {
                return element === true;
              })
            ) {
              stepToQueue = steps[stepIndex];
              branch = branchIndex;
              break step_loop;
            }
          }
        }
      }

      // If customer isn't in step, we throw error, otherwise we queue and consume event
      if (stepToQueue) {
        let found: boolean = false;
        for (let i = 0; i < stepToQueue.customers.length; i++) {
          if (JSON.parse(stepToQueue.customers[i]).customerID === customer.id)
            found = true;
        }
        if (!found) throw new Error('Customer has not yet arrived in step.');
        else
          await this.transitionQueue.add(stepToQueue.type, {
            step: stepToQueue.id,
            branch: branch,
            customer: customer.id,
            session: job.data.session,
          });
      } else return;
    } catch (e) {
      await transactionSession.abortTransaction();
      await queryRunner.rollbackTransaction();
      err = err;
    } finally {
      await transactionSession.endSession();
      await queryRunner.release();
      if (err) throw err;
    }
    return;
  }
}
