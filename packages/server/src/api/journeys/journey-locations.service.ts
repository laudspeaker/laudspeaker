import {
  Logger,
  Inject,
  Injectable,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  DataSource,
  FindOptionsWhere,
  In,
  Like,
  QueryRunner,
  Repository,
} from 'typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { UpdateJourneyDto } from './dto/update-journey.dto';
import { Journey } from './entities/journey.entity';
import errors from '../../shared/utils/errors';
import { CustomerDocument } from '../customers/schemas/customer.schema';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { createClient } from '@clickhouse/client';
import { isUUID } from 'class-validator';
import mongoose, { ClientSession, Model } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { BadRequestException } from '@nestjs/common/exceptions';
import { StepsService } from '../steps/steps.service';
import { Step } from '../steps/entities/step.entity';
import { Graph, alg } from '@dagrejs/graphlib';
import { UpdateJourneyLayoutDto } from './dto/update-journey-layout.dto';
import { v4 as uuid } from 'uuid';
import {
  BranchType,
  EdgeType,
  FilterByOption,
  NodeType,
  ProviderType,
  TimeType,
} from './types/visual-layout.interface';
import {
  AnalyticsEvent,
  AnalyticsEventCondition,
  AttributeBranch,
  AttributeGroup,
  ComponentEvent,
  CustomComponentStepMetadata,
  ElementCondition,
  EventBranch,
  PropertyCondition,
  StartStepMetadata,
  StepType,
} from '../steps/types/step.interface';
import { MessageStepMetadata } from '../steps/types/step.interface';
import { WaitUntilStepMetadata } from '../steps/types/step.interface';
import { LoopStepMetadata } from '../steps/types/step.interface';
import { ExitStepMetadata } from '../steps/types/step.interface';
import { TimeDelayStepMetadata } from '../steps/types/step.interface';
import { TimeWindow } from '../steps/types/step.interface';
import { TimeWindowStepMetadata } from '../steps/types/step.interface';
import { CustomerAttribute } from '../steps/types/step.interface';
import { MultiBranchMetadata } from '../steps/types/step.interface';
import { Temporal } from '@js-temporal/polyfill';
import generateName from '@good-ghosting/random-name-generator';
import { JourneyLocation } from './entities/journey-location.entity';

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
        moveStarted: new Date(),
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
        moveStarted: new Date(),
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
        lock: { mode: 'pessimistic_write' },
      });
    } else {
      return await this.journeyLocationsRepository.findOne({
        where: {
          journey: journey.id,
          owner: { id: account.id },
          customer: customer,
        },
        lock: { mode: 'pessimistic_write' },
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

      location.moveStarted = null;

      await queryRunner.manager.save(location);
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
}
