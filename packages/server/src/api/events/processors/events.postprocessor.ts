import { Job, MetricsTime, Queue } from 'bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { CustomersService } from '../../customers/customers.service';
import { JourneysService } from '../../journeys/journeys.service';
import { DataSource } from 'typeorm';
import { SegmentsService } from '../../segments/segments.service';
import { Account } from '../../accounts/entities/accounts.entity';
import { Workspaces } from '../../workspaces/entities/workspaces.entity';
import * as Sentry from '@sentry/node';
import { Processor } from '../../../common/services/queue/decorators/processor';
import { ProcessorBase } from '../../../common/services/queue/classes/processor-base';
import { Customer } from '../../customers/entities/customer.entity';

@Injectable()
@Processor('events_post')
export class EventsPostProcessor extends ProcessorBase {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    private readonly segmentsService: SegmentsService,
    private dataSource: DataSource
  ) {
    super();
  }

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: EventsPostProcessor.name,
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
        class: EventsPostProcessor.name,
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
        class: EventsPostProcessor.name,
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
        class: EventsPostProcessor.name,
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
        class: EventsPostProcessor.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  async process(
    job: Job<
      {
        owner: Account;
        workspace: Workspaces;
        event: any;
        session: string;
        customer: Customer;
      },
      any,
      any
    >
  ): Promise<any> {
    return Sentry.startSpan(
      { name: 'EventsPostProcessor.process' },
      async () => {
        let err: any;
        const queryRunner = await this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();
        try {
          await this.segmentsService.updateCustomerSegmentsUsingEvent(
            job.data.owner,
            job.data.event,
            job.data.customer.id.toString(),
            job.data.session,
            queryRunner
          );
          // TODO: Add back journey enrollment updater
          // await this.journeysService.updateEnrollmentForCustomer(
          //   job.data.owner,
          //   customer._id,
          //   message.operationType === 'insert' ? 'NEW' : 'CHANGE',
          //   job.data.session,
          //   queryRunner,
          //   clientSession
          // );
          await queryRunner.commitTransaction();
        } catch (e) {
          this.error(e, this.process.name, job.data.session);
          err = e;
          await queryRunner.rollbackTransaction();
        } finally {
          await queryRunner.release();
          if (err) throw err;
        }
      }
    );
  }
}
