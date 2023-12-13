import { Logger, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, IsNull, QueryRunner, Repository } from 'typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { Journey } from './entities/journey.entity';
import { CustomerDocument } from '../customers/schemas/customer.schema';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { StepsService } from '../steps/steps.service';
import { Step } from '../steps/entities/step.entity';
import { Temporal } from '@js-temporal/polyfill';
import { JourneyLocation } from './entities/journey-location.entity';
import { StepType } from '../steps/types/step.interface';

const LOCATION_LOCK_TIMEOUT_MS = +process.env.LOCATION_LOCK_TIMEOUT_MS;

@Injectable()
export class JourneyLocationsService {
  constructor(
    private dataSource: DataSource,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @InjectRepository(JourneyLocation)
    public journeyLocationsRepository: Repository<JourneyLocation>,
    @Inject(StepsService) private stepsService: StepsService
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
  async create(
    account: Account,
    journey: Journey,
    step: Step,
    customer: CustomerDocument,
    session: string,
    queryRunner?: QueryRunner
  ) {
    if (queryRunner) {
      // Step 1: Check if customer is already enrolled in Journey; if so, throw error
      const location = await queryRunner.manager.findOne(JourneyLocation, {
        where: {
          journey: journey.id,
          owner: { id: account.id },
          customer: customer.id,
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (location)
        throw new Error(
          `Customer ${customer.id} already enrolled in journey ${journey.id}; located in step ${location.step.id}`
        );

      // Step 2: Create new journey Location row, add time that user entered the journey
      await queryRunner.manager.save(JourneyLocation, {
        journey: journey.id,
        owner: account,
        customer: customer.id,
        step: step,
        stepEntry: new Date(),
        moveStarted: Date.now(),
      });
    } else {
      const location = await this.journeyLocationsRepository.findOne({
        where: {
          journey: journey.id,
          owner: { id: account.id },
          customer: customer.id,
        },
        lock: { mode: 'pessimistic_write' },
      });
      if (location)
        throw new Error(
          `Customer ${customer.id} already enrolled in journey ${journey.id}; located in step ${location.step.id}`
        );
      await this.journeyLocationsRepository.save({
        journey: journey.id,
        owner: account,
        customer: customer.id,
        step: step,
        stepEntry: new Date(),
        moveStarted: Date.now(),
      });
    }
  }

  /**
   * Moves a customer from one step to another while they are actively being moved.
   *
   * This method should only be called by time and event triggered steps.
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
  async startMove(
    account: Account,
    journey: Journey,
    from: Step,
    to: Step,
    customer: CustomerDocument,
    session: string,
    queryRunner?: QueryRunner
  ) {
    if (queryRunner) {
      // Step 1: Check if customer is enrolled in journey. If not, throw error
      const location = await queryRunner.manager.findOne(JourneyLocation, {
        where: {
          journey: journey.id,
          owner: { id: account.id },
          customer: customer.id,
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (!location)
        throw new Error(
          `Customer ${customer.id} has not been enrolled in journey ${journey.id}`
        );

      // Step 2: Check if there is timestamp indicating that this customer is
      // still being moved. if there is one and it is less than 5 minutes old,
      // throw error.

      const duration = Temporal.Now.instant().since(
        Temporal.Instant.from(location.moveStarted.toISOString())
      );

      // Move started less than 5 mins ago
      if (
        Temporal.Duration.compare(
          new Temporal.Duration(0, 0, 0, 0, 0, 5),
          duration
        ) > 0
      ) {
        throw new Error(
          `Customer ${customer.id} is still moving through journey ${journey.id}`
        );
      }

      // Step 3: If from step doesnt match current step for this customer in
      // this journey, warn that the customer will not be moved and return
      if (location.step.id !== from.id) {
        this.warn(
          JSON.stringify({
            warning: `Customer ${customer.id} not in step ${from.id}`,
          }),
          this.startMove.name,
          session,
          account.email
        );
        return;
      }

      // Step 4: If everything checks out, start moving customer
      await queryRunner.manager.save(JourneyLocation, {
        journey: journey.id,
        owner: account,
        customer: customer.id,
        step: to,
        stepEntry: new Date(),
        moveStarted: new Date(),
      });
    } else {
      // Step 1: Check if customer is enrolled in journey. If not, throw error
      const location = await this.journeyLocationsRepository.findOne({
        where: {
          journey: journey.id,
          owner: { id: account.id },
          customer: customer.id,
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (!location)
        throw new Error(
          `Customer ${customer.id} has not been enrolled in journey ${journey.id}`
        );

      // Step 2: Check if there is timestamp indicating that this customer is
      // still being moved. if there is one and it is less than 5 minutes old,
      // throw error.

      const duration = Temporal.Now.instant().since(
        Temporal.Instant.from(location.moveStarted.toISOString())
      );

      // Move started less than 5 mins ago
      if (
        Temporal.Duration.compare(
          new Temporal.Duration(0, 0, 0, 0, 0, 5),
          duration
        ) > 0
      ) {
        throw new Error(
          `Customer ${customer.id} is still moving through journey ${journey.id}`
        );
      }

      // Step 3: If from step doesnt match current step for this customer in
      // this journey, warn that the customer will not be moved and return
      if (location.step.id !== from.id) {
        this.warn(
          JSON.stringify({
            warning: `Customer ${customer.id} not in step ${from.id}`,
          }),
          this.startMove.name,
          session,
          account.email
        );
        return;
      }

      // Step 4: If everything checks out, start moving customer
      await this.journeyLocationsRepository.save({
        journey: journey.id,
        owner: account,
        customer: customer.id,
        step: to,
        stepEntry: new Date(),
        moveStarted: new Date(),
      });
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
  async continueMove(
    account: Account,
    journey: Journey,
    from: Step,
    to: Step,
    customer: CustomerDocument,
    session: string,
    queryRunner?: QueryRunner
  ) {
    this.warn(
      JSON.stringify({ account, journey, from, to, customer }),
      this.continueMove.name,
      session,
      account.email
    );

    if (queryRunner) {
      // Step 1: Check if customer is enrolled in journey. If not, throw error
      const location = await queryRunner.manager.findOne(JourneyLocation, {
        where: {
          journey: journey.id,
          owner: { id: account.id },
          customer: customer.id,
        },
        loadRelationIds: true,
        lock: { mode: 'pessimistic_write' },
      });

      this.warn(
        JSON.stringify({ location: location }),
        this.continueMove.name,
        session,
        account.email
      );

      // this.debug(JSON.stringify({ location: location }), this.continueMove.name, session, account.email)
      const step = await this.stepsService.findByID(
        account,
        String(location.step),
        session,
        queryRunner
      );

      if (!location)
        throw new Error(
          `Customer ${customer.id} has not been enrolled in journey ${journey.id}`
        );

      // Step 2: If from step doesnt match current step for this customer in
      // this journey, warn that the customer will not be moved and return
      if (step.id !== from.id) {
        this.warn(
          JSON.stringify({
            warning: `Customer ${customer.id} not in step ${from.id}`,
          }),
          this.startMove.name,
          session,
          account.email
        );
        return;
      }

      // Step 3: If everything checks out, start moving customer
      await queryRunner.manager.update(
        JourneyLocation,
        {
          journey: journey.id,
          owner: { id: account.id },
          customer: customer.id,
        },
        {
          step: to,
          stepEntry: new Date(),
        }
      );
    } else {
      // Step 1: Check if customer is enrolled in journey. If not, throw error
      const location = await this.journeyLocationsRepository.findOne({
        where: {
          journey: journey.id,
          owner: { id: account.id },
          customer: customer.id,
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (!location)
        throw new Error(
          `Customer ${customer.id} has not been enrolled in journey ${journey.id}`
        );

      // Step 2: If from step doesnt match current step for this customer in
      // this journey, warn that the customer will not be moved and return
      if (location.step.id !== from.id) {
        this.warn(
          JSON.stringify({
            warning: `Customer ${customer.id} not in step ${from.id}`,
          }),
          this.startMove.name,
          session,
          account.email
        );
        return;
      }

      // Step 3: If everything checks out, start moving customer
      await this.journeyLocationsRepository.save({
        ...location,
        step: to,
        stepEntry: new Date(),
      });
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
    account: Account,
    journey: Journey,
    customer: string,
    session: string,
    queryRunner?: QueryRunner
  ) {
    if (queryRunner) {
      return await queryRunner.manager.findOne(JourneyLocation, {
        where: {
          journey: journey.id,
          owner: { id: account.id },
          customer: customer,
        },
        loadRelationIds: true,
      });
    } else {
      return await this.journeyLocationsRepository.findOne({
        where: {
          journey: journey.id,
          owner: { id: account.id },
          customer: customer,
        },
        loadRelationIds: true,
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
    account: Account,
    journey: Journey,
    customer: CustomerDocument,
    session: string,
    queryRunner?: QueryRunner
  ) {
    if (queryRunner) {
      const location = await queryRunner.manager.findOne(JourneyLocation, {
        where: {
          journey: journey.id,
          owner: { id: account.id },
          customer: customer.id,
        },
        lock: { mode: 'pessimistic_write' },
      });

      await queryRunner.manager.update(
        JourneyLocation,
        {
          journey: journey.id,
          owner: { id: account.id },
          customer: customer.id,
        },
        {
          moveStarted: null,
        }
      );
    } else {
      const location = await this.journeyLocationsRepository.findOne({
        where: {
          journey: journey.id,
          owner: { id: account.id },
          customer: customer.id,
        },
        lock: { mode: 'pessimistic_write' },
      });

      location.moveStarted = null;

      await this.journeyLocationsRepository.save(location);
    }
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
  async findAndLock(
    journey: Journey,
    customer: CustomerDocument,
    session: string,
    account?: Account,
    queryRunner?: QueryRunner
  ) {
    if (queryRunner) {
      const location = await queryRunner.manager.findOne(JourneyLocation, {
        where: {
          journey: journey.id,
          owner: account ? { id: account.id } : undefined,
          customer: customer.id,
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (
        location.moveStarted &&
        Date.now() - location.moveStarted < LOCATION_LOCK_TIMEOUT_MS
      )
        throw new Error(
          `Customer ${customer.id} is still moving through journey ${journey.id}`
        );

      await queryRunner.manager.update(
        JourneyLocation,
        {
          journey: journey.id,
          owner: account ? { id: account.id } : undefined,
          customer: customer.id,
        },
        {
          moveStarted: Date.now(),
        }
      );
    } else {
      const location = await this.journeyLocationsRepository.findOne({
        where: {
          journey: journey.id,
          owner: account ? { id: account.id } : undefined,
          customer: customer.id,
        },
        lock: { mode: 'pessimistic_write' },
      });

      location.moveStarted = null;

      await this.journeyLocationsRepository.save(location);
    }
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
    if (queryRunner) {
      if (
        location.moveStarted &&
        Date.now() - location.moveStarted < LOCATION_LOCK_TIMEOUT_MS
      )
        throw new Error(
          `Customer ${location.customer} is still moving through journey ${location.journey}`
        );

      await queryRunner.manager.update(
        JourneyLocation,
        {
          journey: location.journey,
          owner: account ? { id: account.id } : undefined,
          customer: location.customer,
        },
        {
          moveStarted: Date.now(),
        }
      );
    } else {
      const location = await this.journeyLocationsRepository.findOne({
        where: {
          journey: journey.id,
          owner: account ? { id: account.id } : undefined,
          customer: customer.id,
        },
        lock: { mode: 'pessimistic_write' },
      });

      location.moveStarted = null;

      await this.journeyLocationsRepository.save(location);
    }
  }
}
