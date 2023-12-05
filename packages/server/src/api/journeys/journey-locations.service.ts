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
import {
  CustomerDocument,
} from '../customers/schemas/customer.schema';
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
    @Inject(StepsService) private stepsService: StepsService,
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
  async create(account: Account, journey: Journey, step: Step, customer: CustomerDocument, session: string, queryRunner?: QueryRunner) {

    if (queryRunner) {
      // Step 1: Check if customer is already enrolled in Journey; if so, throw error
      const location = await queryRunner.manager.findOne(JourneyLocation, {
        where: {
          journey: { id: journey.id },
          owner: { id: account.id },
          customer: customer.id,
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (location)
        throw new Error(`Customer ${customer.id} already enrolled in journey ${journey.id}; located in step ${location.step.id}`);


      // Step 2: Create new journey Location row, add time that user entered the journey
      await queryRunner.manager.save(JourneyLocation, {
        journey: journey,
        owner: account,
        customer: customer.id,
        step: step,
        stepEntry: new Date(),
      });
    } else {
      const location = await this.journeyLocationsRepository.findOne({
        where: {
          journey: { id: journey.id },
          owner: { id: account.id },
          customer: customer.id,
        },
        lock: { mode: 'pessimistic_write' },
      });
      if (location)
        throw new Error(`Customer ${customer.id} already enrolled in journey ${journey.id}; located in step ${location.step.id}`)
      await this.journeyLocationsRepository.save({
        journey: journey,
        owner: account,
        customer: customer.id,
        step: step,
        stepEntry: new Date(),
      });
    }
  }



  /**
   * Moves a customer from one step to another
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
  async move(account: Account, journey: Journey, step: Step, customer: CustomerDocument, end: boolean, session: string, queryRunner?: QueryRunner) {

    if (queryRunner) {
      // Step 1: Check if customer is already enrolled in Journey; if so, throw error
      const location = await queryRunner.manager.findOne(JourneyLocation, {
        where: {
          journey: { id: journey.id },
          owner: { id: account.id },
          customer: customer.id,
        },
        lock: { mode: 'pessimistic_write' },
      });

      if (location)
        throw new Error(`Customer ${customer.id} already enrolled in journey ${journey.id}; located in step ${location.step.id}`);


      // Step 2: Create new journey Location row, add time that user entered the journey
      await queryRunner.manager.save(JourneyLocation, {
        journey: journey,
        owner: account,
        customer: customer.id,
        step: step,
        stepEntry: new Date(),
      });
    } else {
      const location = await this.journeyLocationsRepository.findOne({
        where: {
          journey: { id: journey.id },
          owner: { id: account.id },
          customer: customer.id,
        },
        lock: { mode: 'pessimistic_write' },
      });
      if (location)
        throw new Error(`Customer ${customer.id} already enrolled in journey ${journey.id}; located in step ${location.step.id}`)
      await this.journeyLocationsRepository.save({
        journey: journey,
        owner: account,
        customer: customer.id,
        step: step,
        stepEntry: new Date(),
      });
    }
  }
}
