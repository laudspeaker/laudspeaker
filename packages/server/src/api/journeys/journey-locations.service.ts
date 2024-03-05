import { Logger, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  FindManyOptions,
  FindOptions,
  FindOptionsWhere,
  IsNull,
  QueryRunner,
  Repository,
} from 'typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { Journey } from './entities/journey.entity';
import { CustomerDocument } from '../customers/schemas/customer.schema';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Step } from '../steps/entities/step.entity';
import { JourneyLocation } from './entities/journey-location.entity';
import { StepType } from '../steps/types/step.interface';
import { date } from 'liquidjs/dist/builtin/filters';
import { randomUUID } from 'crypto';

const LOCATION_LOCK_TIMEOUT_MS = +process.env.LOCATION_LOCK_TIMEOUT_MS;

@Injectable()
export class JourneyLocationsService {
  constructor(
    private dataSource: DataSource,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @InjectRepository(JourneyLocation)
    public journeyLocationsRepository: Repository<JourneyLocation>,
    @InjectRepository(Account)
    public accountRepository: Repository<Account>
  ) {}

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: JourneyLocationsService.name,
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
        class: JourneyLocationsService.name,
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
        class: JourneyLocationsService.name,
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
        class: JourneyLocationsService.name,
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
        class: JourneyLocationsService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  /**
   * Creates a Journey Location.
   *
   * This method should only be called by the start processor when
   * a customer is added to the start step of a journey.
   *
   * Takes a write lock on
   * (journey, customer) and sets row
   * to (journey, customer, step), marking the
   * time when it's finished updating the
   * step.
   *
   * @param {Account} account Associated Account
   * @param {Journey} journey Associated Journey
   * @param {Step} step Step customer is located in
   * @param {CustomerDocument} customer Associated Customer
   * @param {string} session HTTP session token
   * @param {QueryRunner} [queryRunner]  Postgres Transaction
   * @returns
   */
  async createAndLock(
    journey: Journey,
    customer: CustomerDocument,
    step: Step,
    session: string,
    account: Account,
    queryRunner?: QueryRunner
  ) {
    this.log(
      JSON.stringify({
        info: `Creating JourneyLocation (${journey.id}, ${customer.id})`,
      }),
      this.createAndLock.name,
      session,
      account.email
    );

    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    if (queryRunner) {
      // Step 1: Check if customer is already enrolled in Journey; if so, throw error
      const location = await queryRunner.manager.findOne(JourneyLocation, {
        where: {
          journey: journey.id,
          workspace: { id: workspace.id },
          customer: customer.id,
        },
      });

      if (location)
        throw new Error(
          `Customer ${customer.id} already enrolled in journey ${journey.id}; located in step ${location.step.id}`
        );

      // Step 2: Create new journey Location row, add time that user entered the journey
      await queryRunner.manager.save(JourneyLocation, {
        journey: journey.id,
        workspace,
        customer: customer.id ?? customer._id.toString(),
        step: step,
        stepEntry: Date.now(),
        moveStarted: Date.now(),
      });
    } else {
      const location = await this.journeyLocationsRepository.findOne({
        where: {
          journey: journey.id,
          workspace: { id: workspace.id },
          customer: customer.id,
        },
      });
      if (location)
        throw new Error(
          `Customer ${customer.id} already enrolled in journey ${journey.id}; located in step ${location.step.id}`
        );
      await this.journeyLocationsRepository.save({
        journey: journey.id,
        workspace,
        customer: customer.id,
        step: step,
        stepEntry: Date.now(),
        moveStarted: Date.now(),
      });
    }
  }

  /**
   * Creates a Journey Location.
   *
   * This method should only be called by the start processor when
   * a customer is added to the start step of a journey.
   *
   * Takes a write lock on
   * (journey, customer) and sets row
   * to (journey, customer, step), marking the
   * time when it's finished updating the
   * step.
   *
   * @param {Account} account Associated Account
   * @param {Journey} journey Associated Journey
   * @param {Step} step Step customer is located in
   * @param {CustomerDocument} customer Associated Customer
   * @param {string} session HTTP session token
   * @param {QueryRunner} [queryRunner]  Postgres Transaction
   * @returns
   */
  async createAndLockBulk(
    journeyId: string,
    customers: string[],
    step: Step,
    session: string,
    account: Account,
    queryRunner: QueryRunner
  ): Promise<JourneyLocation[]> {
    if (!customers.length) return [];
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];
    const valuesPlaceholder = customers
      .map(
        (_, index) =>
          `($1, $${index + 2}, $${customers.length + 2}, $${
            customers.length + 3
          }, $${customers.length + 4}, $${customers.length + 5})`
      )
      .join(', ');
    const query = `
        INSERT INTO journey_location ("journeyId", customer, "stepId", "workspaceId", "stepEntry", "moveStarted")
        VALUES ${valuesPlaceholder}
        RETURNING *
      `;
    const result = await queryRunner.query(query, [
      journeyId,
      ...customers,
      step.id,
      workspace.id,
      Date.now(),
      Date.now(),
    ]);
    return result;
  }

  /**
   *
   * @param journey
   * @param customer
   * @param from
   * @param to
   * @param session
   * @param account
   * @param queryRunner
   */
  async findAndMove(
    journey: Journey,
    customer: CustomerDocument,
    from: Step,
    to: Step,
    session: string,
    account?: Account,
    queryRunner?: QueryRunner
  ) {
    const location = await this.findForWrite(
      journey,
      customer,
      session,
      account,
      queryRunner
    );
    if (!location)
      throw new Error(
        `Customer ${location.customer} is not in journey ${location.journey}`
      );
    await this.move(location, from, to, session, account, queryRunner);
  }

  async findForWrite(
    journey: Journey,
    customer: CustomerDocument,
    session: string,
    account?: Account,
    queryRunner?: QueryRunner
  ): Promise<JourneyLocation> {
    this.log(
      JSON.stringify({
        info: `Finding JourneyLocation (${journey.id}, ${customer.id})`,
      }),
      this.findForWrite.name,
      session,
      account?.email
    );
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    if (queryRunner) {
      return await queryRunner.manager.findOne(JourneyLocation, {
        where: {
          journey: journey.id,
          workspace: workspace ? { id: workspace.id } : undefined,
          customer: customer.id,
        },
        relations: ['step'],
      });
    } else {
      return await this.journeyLocationsRepository.findOne({
        where: {
          journey: journey.id,
          workspace: workspace ? { id: workspace.id } : undefined,

          customer: customer.id,
        },
        relations: ['step'],
      });
    }
  }

  async findForWriteBulk(
    journey: Journey,
    customers: string[],
    queryRunner?: QueryRunner
  ): Promise<JourneyLocation[]> {
    if (queryRunner) {
      return await queryRunner.manager
        .createQueryBuilder(JourneyLocation, 'journeyLocation')
        .where('journeyLocation.journeyId = :journeyId', {
          journeyId: journey.id,
        })
        .andWhere('journeyLocation.customer IN (:...customerIds)', {
          customerIds: customers,
        })
        .getMany();
    } else {
      return await this.journeyLocationsRepository
        .createQueryBuilder('journeyLocation')
        .where('journeyLocation.journeyId = :journeyId', {
          journeyId: journey.id,
        })
        .andWhere('journeyLocation.customer IN (:...customerIds)', {
          customerIds: customers,
        })
        .getMany();
    }
  }

  /**
   * Moves a customer from one step to another while they are actively being moved
   *
   * Takes a write lock on
   * (journey, customer) and sets row
   * to (journey, customer, step), marking the
   * time when it's finished updating the
   * step.
   *
   * @param {Account} account Associated Account
   * @param {Journey} journey Associated Journey
   * @param {Step} step Step customer is located in
   * @param {CustomerDocument} customer Associated Customer
   * @param {string} session HTTP session token
   * @param {QueryRunner} [queryRunner]  Postgres Transaction
   * @returns
   */
  async move(
    location: JourneyLocation,
    from: Step,
    to: Step,
    session: string,
    account?: Account,
    queryRunner?: QueryRunner
  ) {
    this.log(
      JSON.stringify({
        info: `Moving ${location.customer} from ${from.id} to ${to.id}`,
      }),
      this.move.name,
      session,
      account?.email
    );

    this.warn(
      JSON.stringify({ locationStep: location.step, fromId: from.id }),
      this.move.name,
      session,
      account.email
    );

    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    if (String(location.step) !== from.id) {
      this.warn(
        JSON.stringify({
          warning: `Customer ${location.customer} not in step ${from.id}`,
        }),
        this.move.name,
        session,
        account.email
      );
      return;
    }

    if (queryRunner) {
      await queryRunner.manager.update(
        JourneyLocation,
        {
          journey: location.journey,
          workspace: workspace ? { id: workspace.id } : undefined,
          customer: location.customer,
        },
        {
          step: to,
          stepEntry: Date.now(),
        }
      );
    } else {
      await this.journeyLocationsRepository.update(
        {
          journey: location.journey,
          workspace: workspace ? { id: workspace.id } : undefined,
          customer: location.customer,
        },
        {
          step: to,
          stepEntry: Date.now(),
        }
      );
    }
  }

  /**
   * Find a customer's location in a journey.
   *
   * @param {Account} account
   * @param {Journey} journey
   * @param {CustomerDocument} customer
   * @param {String} session
   * @param {QueryRunner} queryRunner
   * @returns
   */
  async find(
    journey: Journey,
    customer: CustomerDocument,
    session: string,
    account?: Account,
    queryRunner?: QueryRunner
  ): Promise<JourneyLocation> {
    this.log(
      JSON.stringify({
        info: `Finding JourneyLocation (${journey.id}, ${customer.id})`,
      }),
      this.find.name,
      session,
      account?.email
    );
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    if (queryRunner) {
      return await queryRunner.manager.findOne(JourneyLocation, {
        where: {
          journey: journey.id,
          workspace: workspace ? { id: workspace.id } : undefined,

          customer: customer.id,
        },
        relations: ['workspace', 'journey', 'step'],
      });
    } else {
      return await this.journeyLocationsRepository.findOne({
        where: {
          journey: journey.id,
          workspace: workspace ? { id: workspace.id } : undefined,

          customer: customer.id,
        },
        relations: ['workspace', 'journey', 'step'],
      });
    }
  }

  /**
   * Returns all journey locations where
   * Step type is time based and moveStarted
   * is.
   *
   * @param {Account} account
   * @param {Journey} journey
   * @param {CustomerDocument} customer
   * @param {String} session
   * @param {QueryRunner} queryRunner
   * @returns
   */
  async findAllStaticCustomersInTimeBasedSteps(
    journey: Journey,
    session: string,
    queryRunner?: QueryRunner
  ) {
    if (queryRunner) {
      return await queryRunner.manager.find(JourneyLocation, {
        where: {
          journey: journey.id,
          step: [
            {
              type: StepType.TIME_DELAY,
            },
            {
              type: StepType.TIME_WINDOW,
            },
            {
              type: StepType.WAIT_UNTIL_BRANCH,
            },
          ],
          moveStarted: IsNull(),
        },
        loadRelationIds: true,
      });
    } else {
      return await this.journeyLocationsRepository.find({
        where: {
          journey: journey.id,
          step: {
            type:
              StepType.TIME_DELAY ||
              StepType.TIME_WINDOW ||
              StepType.WAIT_UNTIL_BRANCH,
          },
          moveStarted: IsNull(),
        },
        lock: { mode: 'pessimistic_write' },
        loadRelationIds: true,
      });
    }
  }

  /**
   * Mark a customer as no longer moving through a journey.
   *
   * @param {Account} account
   * @param {Journey} journey
   * @param {CustomerDocument} customer
   * @param {String} session
   * @param {QueryRunner} [queryRunner]
   */
  async unlock(
    location: JourneyLocation,
    step: Step,
    queryRunner?: QueryRunner
  ) {
    const updateFields = {
      journey: location.journey,
      customer: location.customer,
      moveStarted: null,
      stepEntry: Date.now(),
      step: { id: step.id },
      messageSent: location.messageSent,
    };
    let err, res;

    if (!queryRunner) {
      queryRunner = await this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
      try {
        res = await queryRunner.manager.update(
          JourneyLocation,
          { journey: location.journey, customer: location.customer },
          {
            journey: location.journey,
            customer: location.customer,
            moveStarted: null,
            stepEntry: Date.now(),
            step: { id: step.id },
            messageSent: location.messageSent,
          }
        );
        await queryRunner.commitTransaction();
      } catch (e) {
        this.error(e, this.unlock.name, randomUUID());
        err = e;
        await queryRunner.rollbackTransaction();
      } finally {
        await queryRunner.release();
        if (err) throw err;
      }
    } else {
      res = await queryRunner.manager.update(
        JourneyLocation,
        { journey: location.journey, customer: location.customer },
        {
          journey: location.journey,
          customer: location.customer,
          moveStarted: null,
          stepEntry: Date.now(),
          step: { id: step.id },
          messageSent: location.messageSent,
        }
      );
    }
  }

  /**
   * Mark a customer as no longer moving through a journey.
   *
   * @param {Account} account
   * @param {Journey} journey
   * @param {CustomerDocument} customer
   * @param {String} session
   * @param {QueryRunner} [queryRunner]
   */
  // async findAndUnlock(
  //   journey: Journey,
  //   customer: CustomerDocument,
  //   session: string,
  //   account?: Account,
  //   queryRunner?: QueryRunner
  // ) {
  //   const location = await this.findForWrite(
  //     journey,
  //     customer,
  //     session,
  //     account,
  //     queryRunner
  //   );
  //   if (!location)
  //     throw new Error(
  //       `Customer ${location.customer} is not in journey ${location.journey}`
  //     );
  //   await this.unlock(location, session, account, queryRunner);
  // }

  /**
   * Mark a customer as no longer moving through a journey.
   *
   * @param {Account} account
   * @param {Journey} journey
   * @param {CustomerDocument} customer
   * @param {String} session
   * @param {QueryRunner} [queryRunner]
   */
  async findAndLock(
    journey: Journey,
    customer: CustomerDocument,
    session: string,
    account?: Account,
    queryRunner?: QueryRunner
  ) {
    const location = await this.findForWrite(
      journey,
      customer,
      session,
      account,
      queryRunner
    );
    if (!location)
      throw new Error(
        `Customer ${location.customer} is not in journey ${location.journey}`
      );
    await this.lock(location, session, account, queryRunner);
  }

  /**
   * Mark a customer as started moving through a journey.
   *
   * @param {Account} account
   * @param {Journey} journey
   * @param {CustomerDocument} customer
   * @param {String} session
   * @param {QueryRunner} [queryRunner]
   */
  async lock(
    location: JourneyLocation,
    session: string,
    account?: Account,
    queryRunner?: QueryRunner
  ) {
    this.log(
      JSON.stringify({
        info: `Locking JourneyLocation (${location.journey}, ${location.customer})`,
      }),
      this.lock.name,
      session,
      account?.email
    );
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    if (
      location.moveStarted &&
      Date.now() - location.moveStarted < LOCATION_LOCK_TIMEOUT_MS
    )
      throw Object.assign(
        new Error(
          `Customer ${location.customer} is still moving through journey ${location.journey}`
        ),
        { code: 'CUSTOMER_STILL_MOVING' }
      );
    if (queryRunner) {
      await queryRunner.manager.update(
        JourneyLocation,
        {
          journey: location.journey,
          workspace: workspace ? { id: workspace.id } : undefined,
          customer: location.customer,
        },
        {
          moveStarted: Date.now(),
        }
      );
    } else {
      await this.journeyLocationsRepository.update(
        {
          journey: location.journey,
          workspace: workspace ? { id: workspace.id } : undefined,
          customer: location.customer,
        },
        {
          moveStarted: Date.now(),
        }
      );
    }
  }

  async setMessageSent(location: JourneyLocation, queryRunner?: QueryRunner) {
    const findCriteria: FindOptionsWhere<JourneyLocation> = {
      journey: location.journey,
      customer: location.customer,
    };
    const updateData: Partial<JourneyLocation> = {
      messageSent: true,
    };
    if (queryRunner) {
      await queryRunner.manager.update(
        JourneyLocation,
        findCriteria,
        updateData
      );
    } else {
      await this.journeyLocationsRepository.update(findCriteria, updateData);
    }
  }

  /**
   * Get the number of unique customers enrolled in a specific journey
   *
   * @param account
   * @param journey
   * @param runner
   * @returns number of unique customers enrolled in a specific journey
   */
  async getNumberOfEnrolledCustomers(
    account: Account,
    journey: Journey,
    runner?: QueryRunner
  ) {
    const queryCriteria: FindManyOptions<JourneyLocation> = {
      where: {
        workspace: { id: account.teams?.[0]?.organization?.workspaces?.[0].id },
        journey: journey.id,
      },
    };
    let count: number;
    if (runner) {
      count = await runner.manager.count(JourneyLocation, queryCriteria);
    } else {
      count = await this.journeyLocationsRepository.count(queryCriteria);
    }
    return count;
  }

  /**
   * Get the number of customers on a specific journey who have sent a message at some
   * point on the journey.
   *
   * @param account
   * @param journey
   * @param runner
   * @returns number of unique customers on a journey who have sent a message
   */
  async getNumberOfUniqueCustomersMessaged(
    account: Account,
    journey: Journey,
    runner?: QueryRunner
  ) {
    const queryCriteria: FindManyOptions<JourneyLocation> = {
      where: {
        workspace: { id: account.teams[0].organization.workspaces[0].id },
        journey: journey.id,
        messageSent: true,
      },
    };
    let count: number;
    if (runner) {
      count = await runner.manager.count(JourneyLocation, queryCriteria);
    } else {
      count = await this.journeyLocationsRepository.count(queryCriteria);
    }
    return count;
  }
}
