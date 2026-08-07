import { Logger, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  FindManyOptions,
  FindOptionsWhere,
  IsNull,
  QueryRunner,
  Repository,
  In,
} from 'typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { Journey } from './entities/journey.entity';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Step } from '../steps/entities/step.entity';
import { JourneyLocation } from './entities/journey-location.entity';
import { StepType } from '../steps/types/step.interface';
import { randomUUID } from 'crypto';
import { Readable } from 'node:stream';
import * as copyFrom from 'pg-copy-streams';
import { Customer } from '../customers/entities/customer.entity';
import { Query } from '../../common/services/query';

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
  ) { }

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
    customer: Customer,
    step_id: string,
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
          journey_id: journey.id,
          workspace_id: workspace.id,
          customer_id: customer.id,
        },
      });

      if (location)
        throw new Error(
          `Customer ${customer.id} already enrolled in journey ${journey.id}; located in step ${location.step_id}`
        );

      // Step 2: Create new journey Location row, add time that user entered the journey
      await queryRunner.manager.save(JourneyLocation, {
        journey_id: journey.id,
        workspace_id: workspace.id,
        customer_id: customer.id,
        step_id: step_id,
        stepEntry: Date.now(),
        moveStarted: Date.now(),
      });
    } else {
      const location = await this.journeyLocationsRepository.findOne({
        where: {
          journey_id: journey.id,
          workspace_id: workspace.id,
          customer_id: customer.id,
        },
      });
      if (location)
        throw new Error(
          `Customer ${customer.id} already enrolled in journey ${journey.id}; located in step ${location.step_id}`
        );
      await this.journeyLocationsRepository.save({
        journey_id: journey.id,
        workspace_id: workspace.id,
        customer_id: customer.id,
        step_id: step_id,
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
   * @param {Query} query to fetch customers
   * @param {Step} step Step customer is located in
   * @param {string} session HTTP session token
   * @param {QueryRunner} [queryRunner]  Postgres Transaction
   * @returns
   */
  async createAndLockBulk(
    account: Account,
    journeyId: string,
    queryJSON: any,
    step_id: string,
    session: string,
  ): Promise<void> {
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    const moveStarted = Date.now(),
      stepEntry = Date.now(),
      stepEntryAt = new Date(Date.now()),
      journeyEntry = Date.now(),
      journeyEntryAt = new Date(Date.now());

    const query: Query = Query.fromJSON(queryJSON);
    query.setContext({
      "journey_id": journeyId ,
      "step_id": step_id,
      "workspace_id": workspace.id,
    });

    return query.createJourneyLocationsFromQuery(this.dataSource);

    // Create a readable stream from your customers array
    // const readableStream = new Readable({
    //   read() {
    //     customers.forEach((customerId) => {
    //       this.push(
    //         `${journeyId}\t${customerId}\t${step_id}\t${workspace.id
    //         }\t${moveStarted}\t${stepEntry}\t${journeyEntry}\t${stepEntryAt.toISOString()}\t${journeyEntryAt.toISOString()}\n`
    //       );
    //     });
    //     this.push(null); // No more data
    //   },
    // });

    // const stream = client.query(
    //   copyFrom.from(
    //     `COPY journey_location ("journeyId", "customer", "stepId", "workspaceId", "moveStarted", "stepEntry", "journeyEntry", "stepEntryAt", "journeyEntryAt") FROM STDIN WITH (FORMAT text)`
    //   )
    // );

    // const self = this;

    // const promise = new Promise<void>(function (resolve, reject) {
    //   const successHandler = () => {
    //     self.debug(
    //       `Finished creating journey location rows for ${journeyId}`,
    //       self.createAndLockBulk.name,
    //       session,
    //       account.email
    //     );
    //     resolve();
    //   };

    //   const errorHandler = (error) => {
    //     console.log("errorHandler");
    //     self.error(error, self.createAndLockBulk.name, session, account.email);
    //     reject(error);
    //   };

    //   // Error handling
    //   readableStream.on('error', errorHandler);
    //   stream.on('error', errorHandler);

    //   stream.on('finish', successHandler);

    //   // Pipe the readable stream to the COPY command
    //   readableStream.pipe(stream);
    // });

    // return promise;
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
    customer: Customer,
    from: Step,
    to: Step,
    session: string,
    account?: Account,
    queryRunner?: QueryRunner
  ) {
    const location = await this.findForWrite(
      journey.id,
      customer.id,
      account.teams?.[0]?.organization?.workspaces?.[0].id
    );
    if (!location)
      throw new Error(
        `Customer ${location.customer} is not in journey ${location.journey}`
      );
    await this.move(location, from, to, session, account, queryRunner);
  }

  /**
   * Finds and returns a single JourneyLocation entity for a given journey and customer, including
   * the related Step entity. Optionally uses a QueryRunner for managed transactional queries.
   *
   * This method is intended to retrieve a JourneyLocation entity for a specific customer within a specific
   * journey. It ensures that the Step relation associated with the JourneyLocation is also loaded.
   * This can be particularly useful when detailed information about the step within the journey is needed
   * alongside the journey location data.
   *
   * @param {string} journey_id - The Journey UUID.
   * @param {string} customer_id - customer bigserial id
   * @param {string} workspace_id - Workspace UUID
   * @returns {Promise<JourneyLocation>} A promise that resolves to a JourneyLocation entity matching the specified journey
   * and customer, with the Step relation loaded. If no matching entity is found, the promise resolves to null.
   */
  async findForWrite(
    journey_id: string,
    customer_id: string,
    workspace_id: string,
  ): Promise<JourneyLocation> {
    return this.journeyLocationsRepository.findOne({
      where: {
        journey_id,
        customer_id,
        workspace_id
      }
    });
  }

  /**
   * Finds and returns JourneyLocation entities for a given journey and a list of customers, including
   * the related Step entity for each JourneyLocation. Optionally uses a QueryRunner for managed transactional queries.
   *
   * @param {Journey} journey - The journey entity for which to find related JourneyLocation entities.
   * @param {string[]} customers - An array of customer identifiers to filter the JourneyLocation entities by.
   * @param {QueryRunner} [queryRunner] - An optional QueryRunner instance for transaction management. If provided,
   * the function will use it to execute the query within a managed transaction. Otherwise, it uses the default
   * repository to execute the query. When executed, the JourneyLocation entities returned will include
   * their related Step entity fully loaded.
   * @returns {Promise<JourneyLocation[]>} A promise that resolves to an array of JourneyLocation entities
   * matching the specified journey and customer IDs, with each entity's Step relation loaded. If no matching
   * entities are found or if the customers array is empty, the promise resolves to an empty array.
   *
   * @example
   * // Without a QueryRunner
   * const journeyLocations = await findForWriteBulk(journey, ['customer1', 'customer2']);
   * // The returned journeyLocations will have the Step relation loaded for each entity.
   *
   * @example
   * // With a QueryRunner, within a transaction
   * const queryRunner = connection.createQueryRunner();
   * await queryRunner.connect();
   * await queryRunner.startTransaction();
   * try {
   *   const journeyLocations = await findForWriteBulk(journey, ['customer1', 'customer2'], queryRunner);
   *   // The returned journeyLocations will have the Step relation loaded for each entity.
   *   await queryRunner.commitTransaction();
   * } catch (err) {
   *   await queryRunner.rollbackTransaction();
   * } finally {
   *   await queryRunner.release();
   * }
   */
  async findForWriteBulk(
    journey: Journey,
    customers: string[],
    queryRunner?: QueryRunner
  ): Promise<JourneyLocation[]> {
    if (!customers.length) return [];
    if (queryRunner) {
      return await queryRunner.manager
        .createQueryBuilder(JourneyLocation, 'journeyLocation')
        .leftJoinAndSelect('journeyLocation.step', 'step')
        .where('journeyLocation.journey_id = :journeyId', {
          journeyId: journey.id,
        })
        .andWhere('journeyLocation.customer_id IN (:...customerIds)', {
          customerIds: customers,
        })
        .getMany();
    } else {
      return await this.journeyLocationsRepository
        .createQueryBuilder('journeyLocation')
        .leftJoinAndSelect('journeyLocation.step', 'step')
        .where('journeyLocation.journey_id = :journeyId', {
          journeyId: journey.id,
        })
        .andWhere('journeyLocation.customer_id IN (:...customerIds)', {
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
          journey_id: location.journey_id,
          workspace_id: location.workspace_id,
          customer_id: location.customer_id,
        },
        {
          step: to,
          stepEntry: Date.now(),
        }
      );
    } else {
      await this.journeyLocationsRepository.update(
        {
          journey_id: location.journey_id,
          workspace_id: location.workspace_id,
          customer_id: location.customer_id,
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
    customer: Customer,
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
          journey_id: journey.id,
          workspace_id: workspace.id,
          customer_id: customer.id,
        },
        relations: ['workspace', 'journey', 'step'],
      });
    } else {
      return await this.journeyLocationsRepository.findOne({
        where: {
          journey_id: journey.id,
          workspace_id: workspace.id,
          customer_id: customer.id,
        },
        relations: ['workspace', 'journey', 'step'],
      });
    }
  }

  async *findAllStaticCustomersInTimeBasedStepsUsingStream(
    journey: Journey,
    session: string,
    processorIndex: number,
    totalProcessors: number,
    timeoutDuration: number = 30000, // default timeout duration in milliseconds
    queryRunner?: QueryRunner
  ) {
    let stream;
    if (queryRunner) {
      stream = await queryRunner.manager
        .createQueryBuilder(JourneyLocation, 'journeyLocation')
        .leftJoinAndSelect('journeyLocation.step', 'step') // Correct join statement
        .where('journeyLocation.journey_id = :journeyId', {
          journeyId: journey.id,
        })
        .andWhere('journeyLocation.moveStarted IS NULL')
        .andWhere(
          `MOD(('x'||substr(MD5(journeyLocation.customer), 1, 16))::bit(64)::bigint, ${totalProcessors}) = ${processorIndex}`
        )
        .andWhere('step.type IN (:...types)', {
          // Ensuring 'step' is used correctly
          types: [
            StepType.TIME_DELAY,
            StepType.TIME_WINDOW,
            StepType.WAIT_UNTIL_BRANCH,
          ],
        })
        .take(1000) // Limit the number of rows returned
        .stream();
    } else {
      stream = await this.journeyLocationsRepository
        .createQueryBuilder('journeyLocation')
        .leftJoinAndSelect('journeyLocation.step', 'step') // Correct join statement
        .where('journeyLocation.journey_id = :journeyId', {
          journeyId: journey.id,
        })
        .andWhere('journeyLocation.moveStarted IS NULL')
        .andWhere(
          `MOD(('x'||substr(MD5(journeyLocation.customer), 1, 16))::bit(64)::bigint, ${totalProcessors}) = ${processorIndex}`
        )
        .andWhere('step.type IN (:...types)', {
          // Ensuring 'step' is used correctly
          types: [
            StepType.TIME_DELAY,
            StepType.TIME_WINDOW,
            StepType.WAIT_UNTIL_BRANCH,
          ],
        })
        .take(1) // Limit the number of rows returned
        .stream();
    }

    const timeoutHandle = setTimeout(() => {
      stream.destroy(); // Handle depending on stream implementation
      console.log('Stream was manually closed due to timeout.');
    }, timeoutDuration);

    try {
      for await (const row of stream) {
        yield row; // Yield each row as it comes in
      }
    } finally {
      clearTimeout(timeoutHandle); // Ensure cleanup
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
          journey_id: journey.id,
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
          journey_id: journey.id,
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
    step_id: string,
    queryRunner?: QueryRunner,
    account?: Account
  ) {
    this.log(
      JSON.stringify({
        info: `Unlocking JourneyLocation (${location.journey}, ${location.customer})`,
      }),
      this.unlock.name,
      'session',
      account?.email
    );
    const updateFields = {
      journey_id: location.journey_id,
      customer_id: location.customer_id,
      moveStarted: null,
      stepEntry: Date.now(),
      step_id: step_id,
      messageSent: location.messageSent,
    };
    let err, res;

    if (!queryRunner) {
      queryRunner = await this.dataSource.createQueryRunner();
      await queryRunner.connect();

      try {
        res = await queryRunner.manager.update(
          JourneyLocation,
          { journey_id: location.journey_id, customer_id: location.customer_id },
          {
            journey_id: location.journey_id,
            customer_id: location.customer_id,
            moveStarted: null,
            stepEntry: Date.now(),
            step_id: step_id,
            messageSent: location.messageSent,
          }
        );

      } catch (e) {
        this.error(e, this.unlock.name, randomUUID());
        err = e;
      } finally {
        await queryRunner.release();
        if (err) throw err;
      }
    } else {
      res = await queryRunner.manager.update(
        JourneyLocation,
        { journey_id: location.journey_id, customer_id: location.customer_id },
        {
          journey_id: location.journey_id,
          customer_id: location.customer_id,
          moveStarted: null,
          stepEntry: Date.now(),
          step_id: step_id,
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
  async findAndLock(
    journey: Journey,
    customer: Customer,
    session: string,
    account?: Account,
    queryRunner?: QueryRunner
  ) {
    const location = await this.findForWrite(
      journey.id,
      customer.id,
      account.teams?.[0]?.organization?.workspaces?.[0].id
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
          journey_id: location.journey_id,
          workspace_id: location.workspace_id,
          customer_id: location.customer_id,
        },
        {
          moveStarted: Date.now(),
        }
      );
    } else {
      await this.journeyLocationsRepository.update(
        {
          journey_id: location.journey_id,
          workspace_id: location.workspace_id,
          customer_id: location.customer_id,
        },
        {
          moveStarted: Date.now(),
        }
      );
    }
  }

  async setMessageSent(location: JourneyLocation, queryRunner?: QueryRunner) {
    const findCriteria: FindOptionsWhere<JourneyLocation> = {
      journey_id: location.journey_id,
      customer_id: location.customer_id,
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
        journey_id: journey.id,
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
        journey_id: journey.id,
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

  async getJourneyListTotalEnrolled(journeyIds: string[]) {
    const ret = {};
    const resultSet = await this.journeyLocationsRepository
      .createQueryBuilder('journeyLocation')
      .where({ journey_id: In(journeyIds) })
      .groupBy("journeyLocation.journey_id")
      .select("journeyLocation.journey_id, COUNT(*) as count")
      .getRawMany();

    for (const row of resultSet) {
      ret[row.journey_id] = +row.count;
    }

    return ret;
  }

  async getCustomerIds(
    workspaceId: string,
    journeyId: string,
    limit?: number,
    offset?: number
  ) {
    const result = [];

    let query = this.journeyLocationsRepository
      .createQueryBuilder('journeyLocation')
      .where({
        workspace_id: workspaceId,
        journey_id: journeyId,
      })
      .select("customer_id")
      .orderBy("customer_id");

    if (limit) query = query.limit(limit);
    if (offset) query = query.offset(offset);

    const strIds = await query.getRawMany();

    for(const id of strIds)
      result.push(id.customer_id);

    return result;
  }
}
