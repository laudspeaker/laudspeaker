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
import { Readable } from 'node:stream';
import * as copyFrom from 'pg-copy-streams';

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
        info: `Creating JourneyLocation (${journey.id}, ${customer._id})`,
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
          customer: customer._id,
        },
      });

      if (location)
        throw new Error(
          `Customer ${customer._id} already enrolled in journey ${journey.id}; located in step ${location.step.id}`
        );

      // Step 2: Create new journey Location row, add time that user entered the journey
      await queryRunner.manager.save(JourneyLocation, {
        journey: journey.id,
        workspace,
        customer: customer._id,
        step: step,
        stepEntry: Date.now(),
        moveStarted: Date.now(),
      });
    } else {
      const location = await this.journeyLocationsRepository.findOne({
        where: {
          journey: journey.id,
          workspace: { id: workspace.id },
          customer: customer._id,
        },
      });
      if (location)
        throw new Error(
          `Customer ${customer._id} already enrolled in journey ${journey.id}; located in step ${location.step.id}`
        );
      await this.journeyLocationsRepository.save({
        journey: journey.id,
        workspace,
        customer: customer._id,
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
    queryRunner: QueryRunner,
    client: any
  ): Promise<void> {
    if (!customers.length) return;
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];
    const moveStarted = Date.now(),
      stepEntry = Date.now(),
      journeyEntry = Date.now();

    // Create a readable stream from your customers array
    const readableStream = new Readable({
      read() {
        customers.forEach((customerId) => {
          this.push(
            `${journeyId}\t${customerId}\t${step.id}\t${workspace.id}\t${moveStarted}\t${stepEntry}\t${journeyEntry}\n`
          );
        });
        this.push(null); // No more data
      },
    });

    const stream = client.query(
      copyFrom.from(
        `COPY journey_location ("journeyId", "customer", "stepId", "workspaceId", "moveStarted", "stepEntry", "journeyEntry") FROM STDIN WITH (FORMAT text)`
      )
    );

    // Error handling
    stream.on('error', (error) => {
      this.error(error, this.createAndLockBulk.name, session, account.email);
      throw error;
    });
    stream.on('finish', () => {
      this.debug(
        `Finished creating journey location rows for ${journeyId}`,
        this.createAndLockBulk.name,
        session,
        account.email
      );
    });

    // Pipe the readable stream to the COPY command
    readableStream.pipe(stream);
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

  /**
   * Finds and returns a single JourneyLocation entity for a given journey and customer, including
   * the related Step entity. Optionally uses a QueryRunner for managed transactional queries.
   *
   * This method is intended to retrieve a JourneyLocation entity for a specific customer within a specific
   * journey. It ensures that the Step relation associated with the JourneyLocation is also loaded.
   * This can be particularly useful when detailed information about the step within the journey is needed
   * alongside the journey location data.
   *
   * @param {Journey} journey - The Journey entity for which to find the JourneyLocation.
   * @param {CustomerDocument} customer - The CustomerDocument entity representing the customer for whom to find the JourneyLocation.
   * @param {QueryRunner} [queryRunner] - An optional QueryRunner instance for transaction management. If provided,
   * the query will be executed within a managed transaction. Otherwise, the default repository is used to execute the query.
   * @returns {Promise<JourneyLocation>} A promise that resolves to a JourneyLocation entity matching the specified journey
   * and customer, with the Step relation loaded. If no matching entity is found, the promise resolves to null.
   *
   * @example
   * // Without a QueryRunner
   * const journeyLocation = await findForWrite(journey, customerDocument);
   * // The returned journeyLocation will have the Step relation loaded.
   *
   * @example
   * // With a QueryRunner, within a transaction
   * const queryRunner = connection.createQueryRunner();
   * await queryRunner.connect();
   * try {
   *   const journeyLocation = await findForWrite(journey, customerDocument, queryRunner);
   *   // The returned journeyLocation will have the Step relation loaded.
   * } finally {
   *   await queryRunner.release();
   * }
   */
  async findForWrite(
    journey: Journey,
    customer: CustomerDocument,
    session: string,
    account?: Account,
    queryRunner?: QueryRunner
  ): Promise<JourneyLocation> {
    if (queryRunner) {
      return await queryRunner.manager.findOne(JourneyLocation, {
        where: {
          journey: journey.id,
          customer: customer._id,
        },
        relations: ['step'],
      });
    } else {
      return await this.journeyLocationsRepository.findOne({
        where: {
          journey: journey.id,
          customer: customer._id,
        },
        relations: ['step'],
      });
    }
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
        .leftJoinAndSelect('journeyLocation.step', 'step')
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

          customer: customer._id,
        },
        relations: ['workspace', 'journey', 'step'],
      });
    } else {
      return await this.journeyLocationsRepository.findOne({
        where: {
          journey: journey.id,
          workspace: workspace ? { id: workspace.id } : undefined,

          customer: customer._id,
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
