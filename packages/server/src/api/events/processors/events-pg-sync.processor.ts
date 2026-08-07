import {
  OnWorkerEvent,
} from '@nestjs/bullmq';
import { Job, MetricsTime, Queue, UnrecoverableError } from 'bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import * as Sentry from '@sentry/node';
import { Processor } from '@/common/services/queue/decorators/processor';
import { ProcessorBase } from '@/common/services/queue/classes/processor-base';
import { QueueType } from '@/common/services/queue/types/queue-type';
import { PGEvent } from '../entities/pg-event.entity';

/**
 * EventsPGSyncProcessor is a worker class responsible for ensuring
 * events stays in sync between clickhouse and postgres
 */
@Injectable()
@Processor(QueueType.EVENTS_PG_SYNC)
export class EventsPGSyncProcessor extends ProcessorBase {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    private dataSource: DataSource,
    @InjectRepository(PGEvent)
    private readonly pgEventsRepository: Repository<PGEvent>,
  ) {
    super();
  }

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: EventsPGSyncProcessor.name,
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
        class: EventsPGSyncProcessor.name,
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
        class: EventsPGSyncProcessor.name,
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
        class: EventsPGSyncProcessor.name,
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
        class: EventsPGSyncProcessor.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  async process(job: Record<string, any>[]): Promise<any> {
    return Sentry.startSpan(
      { name: `EventsPGSyncProcessor.process` },
      async () => {
        // console.log(`SYNCING EVENT: ${JSON.stringify(job)}`);
        
        const record = await this.pgEventsRepository.save(job);
      }
    );
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, error: Error, prev?: string) {
    Sentry.withScope((scope) => {
      scope.setTag('job_id', job.id);
      scope.setTag('processor', EventsPGSyncProcessor.name);
      Sentry.captureException(error);
    });
  }
}
