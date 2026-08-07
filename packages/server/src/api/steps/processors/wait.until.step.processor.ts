/* eslint-disable no-case-declarations */
import { Inject, Logger } from '@nestjs/common';
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
import { Temporal } from '@js-temporal/polyfill';
import { Processor } from '../../../common/services/queue/decorators/processor';
import { ProcessorBase } from '../../../common/services/queue/classes/processor-base';
import { QueueType } from '../../../common/services/queue/types/queue-type';
import { Producer } from '../../../common/services/queue/classes/producer';
import { Customer } from '../../customers/entities/customer.entity';
import { CacheConstants } from '../../../common/services/cache.constants';

@Injectable()
@Processor('wait.until.step')
export class WaitUntilStepProcessor extends ProcessorBase {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @Inject(JourneyLocationsService)
    private journeyLocationsService: JourneyLocationsService,
    @Inject(StepsService) private stepsService: StepsService,
    @Inject(CacheService) private cacheService: CacheService,
  ) {
    super();
  }

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: WaitUntilStepProcessor.name,
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
        class: WaitUntilStepProcessor.name,
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
        class: WaitUntilStepProcessor.name,
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
        class: WaitUntilStepProcessor.name,
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
        class: WaitUntilStepProcessor.name,
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
      { name: 'WaitUntilStepProcessor.process' },
      async () => {
        let nextJob;
        let nextStep: Step,
          moveCustomer = false;

        // Time branch case
        if (job.data.branch < 0 && job.data.step.metadata.timeBranch) {
          if (job.data.step.metadata.timeBranch.delay) {
            if (
              Date.now() - job.data.location.stepEntry >
              Temporal.Duration.from(
                job.data.step.metadata.timeBranch.delay
              ).total({
                unit: 'millisecond',
              })
            ) {
              moveCustomer = true;
            }
          } else if (job.data.step.metadata.timeBranch.window) {
            if (job.data.step.metadata.timeBranch.window.onDays) {
              const now = new Date();

              const startTime = new Date(now.getTime());
              startTime.setHours(
                job.data.step.metadata.timeBranch.window.fromTime.split(':')[0]
              );
              startTime.setMinutes(
                job.data.step.metadata.timeBranch.window.fromTime.split(':')[1]
              );

              const endTime = new Date(now.getTime());
              endTime.setHours(
                job.data.step.metadata.timeBranch.window.toTime.split(':')[0]
              );
              endTime.setMinutes(
                job.data.step.metadata.timeBranch.window.toTime.split(':')[1]
              );

              const day = now.getDay();

              if (
                startTime < now &&
                endTime > now &&
                job.data.step.metadata.timeBranch.window.onDays[day] === 1
              ) {
                moveCustomer = true;
              }
            }
            // Case2: Date and time of window
            else {
              if (
                new Date(
                  Temporal.Instant.from(
                    job.data.step.metadata.timeBranch.window.from
                  ).epochMilliseconds
                ).getTime() < Date.now() &&
                Date.now() <
                  new Date(
                    Temporal.Instant.from(
                      job.data.step.metadata.timeBranch.window.to
                    ).epochMilliseconds
                  ).getTime()
              ) {
                moveCustomer = true;
              }
            }
          }
          if (moveCustomer) {
            nextStep = await this.cacheService.getIgnoreError(
              CacheConstants.STEPS,
              job.data.step.metadata.timeBranch?.destination,
              async () => {
                return await this.stepsService.lazyFindByID(
                  job.data.step.metadata.timeBranch?.destination
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
          } else {
            // Not yet time to move customer,
            // customer has stopped moving so we can release lock
            await this.journeyLocationsService.unlock(
              job.data.location,
              job.data.step.id
            );
          }
        } else if (
          job.data.branch > -1 &&
          job.data.step.metadata.branches.length > 0
        ) {
          let nextStepId = job.data.step.metadata.branches.filter(
            (branchItem) => {
              return branchItem.index === job.data.branch;
            }
          )[0].destination;

          nextStep = await this.cacheService.getIgnoreError(
            CacheConstants.STEPS,
            nextStepId,
            async () => {
              return await this.stepsService.lazyFindByID(nextStepId);
            }
          );

          if (nextStep) {
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
        } else {
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
      scope.setTag('processor', WaitUntilStepProcessor.name);
      Sentry.captureException(error);
    });
  }
}
