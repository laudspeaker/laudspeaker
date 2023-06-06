import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { Step } from './entities/step.entity';
import { CreateStepDto } from './dto/create-step.dto';
import { UpdateStepDto } from './dto/update-step.dto';
import { Account } from '../accounts/entities/accounts.entity';
import { CustomerDocument } from '../customers/schemas/customer.schema';
import Errors from '../../shared/utils/errors';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { StepType } from './types/step.interface';
import { Temporal } from '@js-temporal/polyfill';

@Injectable()
export class StepsService {
  /**
   * Step service constructor; this class is the only class that should
   * be using the Steps repository (`Repository<Step>`) directly.
   * @class
   */
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @InjectRepository(Step)
    public stepsRepository: Repository<Step>,
    @InjectQueue('transition') private readonly transitionQueue: Queue
  ) { }

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: StepsService.name,
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
        class: StepsService.name,
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
        class: StepsService.name,
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
        class: StepsService.name,
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
        class: StepsService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  /**
   * Add array of customer documents to starting step of a journey. Calls
   * addToStart under the hood.
   * @param account 
   * @param journeyID 
   * @param unenrolledCustomers 
   * @param queryRunner 
   * @param session 
   */
  async bulkAddToStart(
    account: Account,
    journeyID: string,
    customers: CustomerDocument[],
    queryRunner: QueryRunner,
    session: string
  ) {
    for (let i = 0; i < customers.length; i++) {
      await this.addToStart(account, journeyID, customers[i], queryRunner, session);
    }
  }

  /**
 * Add array of customer documents to starting step of a journey
 * @param account 
 * @param journeyID 
 * @param unenrolledCustomers 
 * @param queryRunner 
 * @param session 
 */
  async addToStart(
    account: Account,
    journeyID: string,
    customer: CustomerDocument,
    queryRunner: QueryRunner,
    session: string
  ) {
    const startStep = await queryRunner.manager.findBy(Step,
      {
        owner: { id: account.id },
        journey: { id: journeyID },
        type: StepType.START,
      });
    if (startStep.length != 1)
      throw new Error('Can only have one start step per journey.');

    startStep[0].customers = [...startStep[0].customers, JSON.stringify({ customerID: customer.id, timestamp: Temporal.Now.instant().toString() })];
    const step = await queryRunner.manager.save(startStep[0]);
    await this.transitionQueue.add("", { account: account, step: step, session: session });
  }


  /**
   * Find all steps belonging to an account.
   * @param account 
   * @param session 
   * @returns 
   */
  async findAll(account: Account, session: string): Promise<Step[]> {
    try {
      return await this.stepsRepository.findBy({
        owner: { id: account.id },
      });
    } catch (e) {
      this.error(e, this.findAll.name, session, account.id);
      throw e;
    }
  }

  /**
 * Find all steps of a certain type (owner optional).
 * @param account 
 * @param type
 * @param session 
 * @returns 
 */
  async findAllByType(account: Account, type: StepType, session: string): Promise<Step[]> {
    try {
      return await this.stepsRepository.findBy({
        owner: account ? { id: account.id } : undefined,
        type: type
      });
    } catch (e) {
      this.error(e, this.findAllByType.name, session, account.id);
      throw e;
    }
  }

  /**
   * Find a step by its ID.
   * @param account 
   * @param id 
   * @param session 
   * @returns 
   */
  async findOne(
    account: Account,
    id: string,
    session: string
  ): Promise<Step | null> {
    try {
      return await this.stepsRepository.findOneBy({
        owner: { id: account.id },
        id: id,
      });
    } catch (e) {
      this.error(e, this.findOne.name, session, account.id);
      throw e;
    }
  }

  /**
   * Insert a new step.
   * TODO: Check step metadata matches step type
   * @param account 
   * @param createStepDto 
   * @param session 
   * @returns 
   */
  async insert(
    account: Account,
    createStepDto: CreateStepDto,
    session: string
  ): Promise<Step> {
    try {
      const { journeyID, type, metadata } =
        createStepDto;
      return await this.stepsRepository.save({
        customers: [],
        owner: { id: account.id },
        journey: { id: journeyID },
        type,
        metadata,
      });
    } catch (e) {
      this.error(e, this.insert.name, session, account.id);
      throw e;
    }
  }

  /**
   * Find all steps associated with a journey using DB transaction.
   * @param account 
   * @param id 
   * @param queryRunner 
   * @returns 
   */
  async transactionalfindByJourneyID(account: Account, id: string, queryRunner: QueryRunner) {
    return await queryRunner.manager.find(Step, {
      where: {
        owner: { id: account.id },
        journey: { id: id }
      },
    })
  }

  /**
   * Update a step. If the step's journey is already started this throws an error.
   * TODO: Check that step metadta matches step type.
   * @param account 
   * @param updateStepDto 
   * @param session 
   * @returns 
   */
  async update(
    account: Account,
    updateStepDto: UpdateStepDto,
    session: string
  ): Promise<Step> {
    try {
      const step = await this.stepsRepository.findOneBy({
        owner: { id: account.id },
        id: updateStepDto.id,
      });
      if (!step) {
        throw new Error(Errors.ERROR_DOES_NOT_EXIST);
      }
      if (step.journey.isActive || step.journey.isDeleted || step.journey.isStopped)
        throw new Error('This step is part of a Journey that is already in progress.')


      return await this.stepsRepository.save({
        ...step,
        type: updateStepDto.type,
        metadata: updateStepDto.metadata
      });
    } catch (e) {
      this.error(e, this.update.name, session, account.id);
      throw e;
    }
  }

  /**
   * Delete a step.
   * @param account 
   * @param id 
   * @param session 
   */
  async delete(account: Account, id: string, session: string): Promise<void> {
    try {
      await this.stepsRepository.delete(
        {
          owner: { id: (<Account>account).id },
          id,
        }
      );
    } catch (e) {
      this.error(e, this.delete.name, session, account.email);
      throw e;
    }
  }
}
