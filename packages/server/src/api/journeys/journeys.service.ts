import {
  Logger,
  Inject,
  Injectable,
  HttpException,
  NotFoundException,
  forwardRef,
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
import { CustomersService } from '../customers/customers.service';
import {
  Customer,
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
  AttributeConditions,
  AttributeGroup,
  Branch,
  ComponentEvent,
  CustomComponentStepMetadata,
  ElementCondition,
  EventBranch,
  PropertyCondition,
  StartStepMetadata,
  StepType,
  TimeWindowTypes,
} from '../steps/types/step.interface';
import { MessageStepMetadata } from '../steps/types/step.interface';
import { WaitUntilStepMetadata } from '../steps/types/step.interface';
import { LoopStepMetadata } from '../steps/types/step.interface';
import { ExitStepMetadata } from '../steps/types/step.interface';
import { TimeDelayStepMetadata } from '../steps/types/step.interface';
import { TimeWindow } from '../steps/types/step.interface';
import { TimeWindowStepMetadata } from '../steps/types/step.interface';
import { CustomerAttribute } from '../steps/types/step.interface';
import { AttributeSplitMetadata } from '../steps/types/step.interface';
import { Temporal } from '@js-temporal/polyfill';
import generateName from '@good-ghosting/random-name-generator';
import {
  EntryTiming,
  JourneyEnrollmentType,
} from './types/additional-journey-settings.interface';
import { JourneyLocationsService } from './journey-locations.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

export enum JourneyStatus {
  ACTIVE = 'Active',
  PAUSED = 'Paused',
  STOPPED = 'Stopped',
  DELETED = 'Deleted',
  DRAFT = 'Draft',
}

function isObjKey<T extends object>(key: PropertyKey, obj: T): key is keyof T {
  return key in obj;
}

@Injectable()
export class JourneysService {
  private clickhouseClient = createClient({
    host: process.env.CLICKHOUSE_HOST
      ? process.env.CLICKHOUSE_HOST.includes('http')
        ? process.env.CLICKHOUSE_HOST
        : `http://${process.env.CLICKHOUSE_HOST}`
      : 'http://localhost:8123',
    username: process.env.CLICKHOUSE_USER ?? 'default',
    password: process.env.CLICKHOUSE_PASSWORD ?? '',
    database: process.env.CLICKHOUSE_DB ?? 'default',
  });

  constructor(
    private dataSource: DataSource,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @InjectRepository(Journey)
    public journeysRepository: Repository<Journey>,
    @Inject(StepsService) private stepsService: StepsService,
    @InjectModel(Customer.name) public CustomerModel: Model<CustomerDocument>,
    @Inject(forwardRef(() => CustomersService))
    private customersService: CustomersService,
    @InjectConnection() private readonly connection: mongoose.Connection,
    @Inject(JourneyLocationsService)
    private readonly journeyLocationsService: JourneyLocationsService,
    @InjectQueue('transition') private readonly transitionQueue: Queue
  ) {}

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: JourneysService.name,
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
        class: JourneysService.name,
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
        class: JourneysService.name,
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
        class: JourneysService.name,
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
        class: JourneysService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  /**
   * Creates a journey.
   *
   * @param account
   * @param name
   * @param session
   * @returns
   */
  async create(account: Account, name: string, session: string) {
    try {
      const startNodeUUID = uuid();
      const nextNodeUUID = uuid();

      const journey = await this.journeysRepository.create({
        name,
        owner: { id: account.id },
        visualLayout: {
          nodes: [],
          edges: [
            {
              id: `e${startNodeUUID}-${nextNodeUUID}`,
              type: EdgeType.PRIMARY,
              source: startNodeUUID,
              target: nextNodeUUID,
            },
          ],
        },
      });

      await this.journeysRepository.save(journey);

      const step = await this.stepsService.insert(
        account,
        {
          type: StepType.START,
          journeyID: journey.id,
        },
        session
      );

      journey.visualLayout.nodes = [
        {
          id: startNodeUUID,
          type: NodeType.START,
          data: {
            stepId: step.id,
          },
          position: { x: 0, y: 0 },
        },
        {
          id: nextNodeUUID,
          type: NodeType.EMPTY,
          data: {},
          position: { x: 0, y: 0 },
        },
      ];

      return await this.journeysRepository.save(journey);
    } catch (err) {
      this.error(err, this.create.name, session, account.email);
      throw err;
    }
  }

  /**
   * Creates a journey using a db transaction.
   *
   * @param account
   * @param name
   * @param session
   * @returns
   */
  async transactionalCreate(
    account: Account,
    name: string,
    queryRunner: QueryRunner,
    session: string,
    isRecurrence?: boolean,
    dupeId?: string
  ) {
    try {
      const startNodeUUID = uuid();
      const nextNodeUUID = uuid();

      const journey = await queryRunner.manager.create(Journey, {
        name,
        owner: { id: account.id },
        visualLayout: {
          nodes: [],
          edges: [
            {
              id: `e${startNodeUUID}-${nextNodeUUID}`,
              type: EdgeType.PRIMARY,
              source: startNodeUUID,
              target: nextNodeUUID,
            },
          ],
        },
        isRecurrence: isRecurrence ? true : false,
        recurrenceId: dupeId,
      });

      await queryRunner.manager.save(journey);

      const step = await this.stepsService.transactionalInsert(
        account,
        {
          type: StepType.START,
          journeyID: journey.id,
        },
        queryRunner,
        session
      );

      journey.visualLayout.nodes = [
        {
          id: startNodeUUID,
          type: NodeType.START,
          data: {
            stepId: step.id,
          },
          position: { x: 0, y: 0 },
        },
        {
          id: nextNodeUUID,
          type: NodeType.EMPTY,
          data: {},
          position: { x: 0, y: 0 },
        },
      ];

      return await queryRunner.manager.save(journey);
    } catch (err) {
      this.error(err, this.create.name, session, account.email);
      throw err;
    }
  }

  /**
   * Duplicate a journey.
   * @param user
   * @param id
   * @param session
   */
  async duplicate(user: Account, id: string, session: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let err: any;
    try {
      const oldJourney = await queryRunner.manager.findOne(Journey, {
        where: {
          owner: { id: user.id },
          id,
        },
      });
      if (!oldJourney) throw new NotFoundException('Journey not found');

      let copyEraseIndex = oldJourney.name.indexOf('-copy');
      if (copyEraseIndex === -1) copyEraseIndex = oldJourney.name.length;

      const res = await queryRunner.manager
        .createQueryBuilder(Journey, 'journey')
        .select('COUNT(*)')
        .where('starts_with(name, :oldName) = TRUE AND "ownerId" = :ownerId', {
          oldName: oldJourney.name.substring(0, copyEraseIndex),
          ownerId: user.id,
        })
        .execute();
      const newName =
        oldJourney.name.substring(0, copyEraseIndex) +
        '-copy-' +
        (res?.[0]?.count || '0');
      const newJourney = await this.create(user, newName, session);

      await this.transactionalUpdate(
        user,
        {
          id: newJourney.id,
          name: newName,
          isDynamic: oldJourney.isDynamic,
        },
        session,
        queryRunner
      );

      const oldSteps = await this.stepsService.transactionalfindByJourneyID(
        user,
        oldJourney.id,
        queryRunner
      );

      const startStep = await this.stepsService.transactionalfindByJourneyID(
        user,
        newJourney.id,
        queryRunner
      );
      let startIndex;
      const newSteps: Step[] = await queryRunner.manager.save(
        Step,
        oldSteps
          .filter((oldStep, index) => {
            if (oldStep.type === StepType.START) {
              startIndex = index;
              return false;
            }
            return true;
          })
          .map((oldStep) => {
            return {
              createdAt: new Date(),
              owner: oldStep.owner,
              type: oldStep.type,
              journey: newJourney,
              customers: [],
              isEditable: true,
            };
          })
      );

      newSteps.splice(startIndex, 0, startStep[0]);

      let visualLayout: any = JSON.stringify(oldJourney.visualLayout);

      for (let i = 0; i < oldSteps.length; i++) {
        const oldStepID = oldSteps[i].id;
        const newStepID = newSteps[i].id;
        visualLayout = visualLayout.replaceAll(oldStepID, newStepID);
        if (oldSteps[i].type === StepType.TRACKER) {
          const newStepName = generateName({ number: true }).dashed;
          const oldStepName = oldSteps[i]?.metadata?.humanReadableName;

          if (oldStepName)
            visualLayout = visualLayout.replaceAll(oldStepName, newStepName);
        }
      }

      visualLayout = JSON.parse(visualLayout);
      await this.updateLayoutTransactional(
        user,
        {
          id: newJourney.id,
          nodes: visualLayout.nodes,
          edges: visualLayout.edges,
        },
        queryRunner,
        session
      );

      await queryRunner.commitTransaction();
    } catch (e) {
      err = e;
      this.error(e, this.duplicate.name, session, user.email);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
      if (err) throw err;
    }
  }

  /**
   * Duplicate a journey.
   * @param user
   * @param id
   * @param session
   */
  async duplicateForRecurrence(
    user: Account,
    id: string,
    session: string,
    queryRunner: QueryRunner
  ) {
    const oldJourney = await queryRunner.manager.findOne(Journey, {
      where: {
        owner: { id: user.id },
        id,
      },
    });
    if (!oldJourney) throw new NotFoundException('Journey not found');

    let copyEraseIndex = oldJourney.name.indexOf(' (Reccurence ');
    if (copyEraseIndex === -1) copyEraseIndex = oldJourney.name.length;

    const res = await queryRunner.manager
      .createQueryBuilder(Journey, 'journey')
      .select('COUNT(*)')
      .where('starts_with(name, :oldName) = TRUE AND "ownerId" = :ownerId', {
        oldName: oldJourney.name.substring(0, copyEraseIndex),
        ownerId: user.id,
      })
      .execute();
    const newName =
      oldJourney.name.substring(0, copyEraseIndex) +
      ' (Recurrence ' +
      (res?.[0]?.count || '0') +
      ' at ' +
      new Date().toISOString() +
      ')';
    const newJourney = await this.transactionalCreate(
      user,
      newName,
      queryRunner,
      session,
      true,
      oldJourney.id
    );

    await this.transactionalUpdate(
      user,
      {
        id: newJourney.id,
        name: newName,
        isDynamic: oldJourney.isDynamic,
        journeyEntrySettings: { ...oldJourney.journeyEntrySettings },
        journeySettings: { ...oldJourney.journeySettings },
        isRecurrence: true,
        recurrenceTimestamp: Date.now(),
        recurrenceId: oldJourney.id,
      },
      session,
      queryRunner
    );

    const oldSteps = await this.stepsService.transactionalfindByJourneyID(
      user,
      oldJourney.id,
      queryRunner
    );

    const startStep = await this.stepsService.transactionalfindByJourneyID(
      user,
      newJourney.id,
      queryRunner
    );
    let startIndex;
    const newSteps: Step[] = await queryRunner.manager.save(
      Step,
      oldSteps
        .filter((oldStep, index) => {
          if (oldStep.type === StepType.START) {
            startIndex = index;
            return false;
          }
          return true;
        })
        .map((oldStep) => {
          return {
            createdAt: new Date(),
            owner: oldStep.owner,
            type: oldStep.type,
            journey: newJourney,
            customers: [],
            isEditable: true,
          };
        })
    );

    newSteps.splice(startIndex, 0, startStep[0]);

    let visualLayout: any = JSON.stringify(oldJourney.visualLayout);

    for (let i = 0; i < oldSteps.length; i++) {
      const oldStepID = oldSteps[i].id;
      const newStepID = newSteps[i].id;
      visualLayout = visualLayout.replaceAll(oldStepID, newStepID);
      if (oldSteps[i].type === StepType.TRACKER) {
        const newStepName = generateName({ number: true }).dashed;
        const oldStepName = oldSteps[i]?.metadata?.humanReadableName;

        if (oldStepName)
          visualLayout = visualLayout.replaceAll(oldStepName, newStepName);
      }
    }

    visualLayout = JSON.parse(visualLayout);
    await this.updateLayoutTransactional(
      user,
      {
        id: newJourney.id,
        nodes: visualLayout.nodes,
        edges: visualLayout.edges,
      },
      queryRunner,
      session
    );

    return await queryRunner.manager.findOne(Journey, {
      where: { id: newJourney.id },
      relations: ['owner'],
    });
  }

  /**
   *
   * @param account
   * @param customerId
   * @param customerUpdateType
   * @param session
   * @param queryRunner
   * @param clientSession
   */
  public async updateEnrollmentForCustomer(
    account: Account,
    customerId: string,
    customerUpdateType: 'NEW' | 'CHANGE',
    session: string,
    queryRunner: QueryRunner,
    clientSession: ClientSession
  ) {
    const journeys = await queryRunner.manager.find(Journey, {
      where: {
        owner: { id: account.id },
        isActive: true,
        isStopped: false,
        isPaused: false,
        // TODO_JH should we be checking for these? (should be updated to the proper check for "active/addable")
        isDynamic: true,
      },
    });
    let customer = await this.customersService.findById(
      account,
      customerId,
      clientSession
    );
    for (const journey of journeys) {
      // get segments for journey
      let change: 'ADD' | 'REMOVE' | 'DO_NOTHING' = 'DO_NOTHING';
      let doesInclude = await this.customersService.isCustomerEnrolledInJourney(
        account,
        customer,
        journey,
        session,
        queryRunner
      );
      //let shouldInclude = true;
      // TODO_JH: implement the following
      let shouldInclude = this.customersService.checkCustomerMatchesQuery(
        journey.inclusionCriteria,
        account,
        session,
        undefined,
        customerId
      );
      // if (customer matches journeyInclusionCriteria)
      //     shouldInclude = true
      // for segment in journey.segments
      //    if customer in segment
      //        shouldInclude = true
      if (!doesInclude && shouldInclude) {
        let journeyEntrySettings = journey.journeyEntrySettings ?? {
          enrollmentType: JourneyEnrollmentType.CurrentAndFutureUsers,
        };
        if (
          journeyEntrySettings.enrollmentType ===
          JourneyEnrollmentType.CurrentAndFutureUsers
        ) {
          change = 'ADD';
        } else if (
          journeyEntrySettings.enrollmentType ===
            JourneyEnrollmentType.OnlyFuture &&
          customerUpdateType === 'NEW'
        ) {
          change = 'ADD';
        }
        // TODO_JH: add in check for when customer was added to allow "CHANGE" on OnlyCurrent journey type
      } else if (doesInclude && !shouldInclude) {
        change = 'REMOVE';
      }
      switch (change) {
        case 'ADD':
          await this.enrollCustomerInJourney(
            account,
            journey,
            customer,
            session,
            queryRunner,
            clientSession
          );
          break;
        case 'REMOVE':
          await this.unenrollCustomerFromJourney(
            account,
            journey,
            customer,
            session,
            clientSession
          );
          break;
      }
    }
  }

  /**
   * Enroll customer in a journey.
   * Adds to first step in journey.
   * WARNING: this method does not check if the journey **should** include the customer.
   */
  async enrollCustomerInJourney(
    account: Account,
    journey: Journey,
    customer: CustomerDocument,
    session: string,
    queryRunner: QueryRunner,
    clientSession: ClientSession
  ): Promise<void> {
    const step = await this.stepsService.findByJourneyAndType(
      account,
      journey.id,
      StepType.START,
      session,
      queryRunner
    );
    await this.journeyLocationsService.createAndLock(
      journey,
      customer,
      step,
      session,
      account,
      queryRunner
    );
    await this.transitionQueue.add('start', {
      ownerID: account.id,
      journeyID: journey.id,
      step: step,
      session: session,
      customerID: customer.id,
    });

    await this.CustomerModel.updateOne(
      { _id: customer._id },
      {
        $addToSet: {
          journeys: journey.id,
        },
        $set: {
          journeyEnrollmentsDates: {
            [journey.id]: new Date().toUTCString(),
          },
        },
      }
    )
      .session(clientSession)
      .exec();
  }

  /**
   * Un-Enroll Customer from journey and remove from any steps.
   */
  public async unenrollCustomerFromJourney(
    account: Account,
    journey: Journey,
    customer: CustomerDocument,
    session: string,
    clientSession: ClientSession
  ) {
    // TODO_JH: remove from steps also
    await this.CustomerModel.updateOne(
      { _id: customer._id },
      {
        $pullAll: {
          journeys: [journey.id],
        },
        // TODO_JH: This logic needs to be checked
        $unset: {
          journeyEnrollmentsDates: [journey.id],
        },
      }
    )
      .session(clientSession)
      .exec();
  }

  /**
   *  IMPORTANT: THIS METHOD MUST REMAIN IDEMPOTENT: CUSTOMER SHOULD
   * NOT BE DOUBLE ENROLLED IN JOURNEY
   *
   * Adds a customer to dynamic primary audience of all active journeys,
   * and sends them any relevant messages. Similar to  start,
   * one customer -> many journeys
   *
   * @remarks Throws an error if the journey is not found
   * @param account The owner of the journey
   *
   */
  async enrollCustomer(
    account: Account,
    customer: CustomerDocument,
    queryRunner: QueryRunner,
    clientSession: ClientSession,
    session: string
  ): Promise<void> {
    try {
      const journeys = await queryRunner.manager.find(Journey, {
        where: {
          owner: { id: account.id },
          isActive: true,
          isStopped: false,
          isPaused: false,
          isDynamic: true,
        },
      });
      for (
        let journeyIndex = 0;
        journeyIndex < journeys?.length;
        journeyIndex++
      ) {
        const journey = journeys[journeyIndex];
        if (
          (await this.customersService.checkInclusion(
            customer,
            journey.inclusionCriteria,
            session,
            account
          )) &&
          customer.journeys.indexOf(journey.id) < 0
        ) {
          // await this.stepsService.addToStart(
          //   account,
          //   journey.id,
          //   customer,
          //   queryRunner,
          //   session
          // );
          await this.CustomerModel.updateOne(
            { _id: customer._id },
            {
              $addToSet: {
                journeys: journey.id,
              },
              $set: {
                journeyEnrollmentsDates: {
                  [journey.id]: new Date().toUTCString(),
                },
              },
            }
          )
            .session(clientSession)
            .exec();
        }
      }
    } catch (err) {
      this.error(err, this.enrollCustomer.name, session, account.id);
      throw err;
    }
  }

  /**
   * Finds all active journeys
   *
   * @param account - The owner of the workflows
   *
   */
  async allActiveTransactional(queryRunner: QueryRunner): Promise<Journey[]> {
    return await queryRunner.manager.find(Journey, {
      where: {
        isActive: true,
        isStopped: false,
        isPaused: false,
      },
    });
  }

  /**
   * Finds all journeys matching a certain criteria.
   *
   * @param {Account} account The owner of the journeys
   * @param {string} session HTTP session token
   * @param {number} [take=100] No. of journeys to show; used for pagination, together with skip
   * @param {number} [skip=0] No. of journeys to skip; used for pagination, together with take
   * @param {keyof Journey} [orderBy]
   *
   */
  async findAll(
    account: Account,
    session: string,
    take = 100,
    skip = 0,
    orderBy?: keyof Journey,
    orderType?: 'asc' | 'desc',
    showDisabled?: boolean,
    search = '',
    filterStatusesString = ''
  ): Promise<{ data: Journey[]; totalPages: number }> {
    try {
      const filterStatusesParts = filterStatusesString.split(',');
      const isActive = filterStatusesParts.includes(JourneyStatus.ACTIVE);
      const isPaused = filterStatusesParts.includes(JourneyStatus.PAUSED);
      const isStopped = filterStatusesParts.includes(JourneyStatus.STOPPED);
      const isDeleted = filterStatusesParts.includes(JourneyStatus.DELETED);
      const isEditable = filterStatusesParts.includes(JourneyStatus.DRAFT);

      const whereOrParts: FindOptionsWhere<Journey>[] = [];

      if (isEditable) {
        whereOrParts.push({
          name: Like(`%${search}%`),
          owner: { id: account.id },
          isDeleted: false,
          isActive: false,
          isPaused: false,
          isStopped: false,
        });
      }

      const filterStatuses = {
        isActive,
        isPaused,
        isStopped,
        isDeleted,
      };

      if (isActive || isPaused || isStopped || isDeleted || isEditable) {
        for (const [key, value] of Object.entries(filterStatuses)) {
          if (value)
            whereOrParts.push({
              name: Like(`%${search}%`),
              owner: { id: account.id },
              isDeleted: In([!!showDisabled, false]),
              [key]: value,
              ...(key === 'isActive'
                ? { isStopped: false, isPaused: false }
                : key === 'isPaused'
                ? { isStopped: false }
                : {}),
            });
        }
      } else {
        whereOrParts.push({
          name: Like(`%${search}%`),
          owner: { id: account.id },
          isDeleted: In([!!showDisabled, false]),
        });
      }

      const totalPages = Math.ceil(
        (await this.journeysRepository.count({
          where: whereOrParts,
        })) / take || 1
      );
      const orderOptions = {};
      if (orderBy && orderType) {
        orderOptions[orderBy] = orderType;
      }
      const journeys = await this.journeysRepository.find({
        where: whereOrParts,
        order: orderOptions,
        take: take < 100 ? take : 100,
        skip,
      });

      const journeysWithEnrolledCustomersCount = await Promise.all(
        journeys.map(async (journey) => ({
          ...journey,
          enrolledCustomers: await this.CustomerModel.count({
            journeys: journey.id,
          }),
        }))
      );

      return { data: journeysWithEnrolledCustomersCount, totalPages };
    } catch (err) {
      this.error(err, this.findAll.name, session, account.email);
      throw err;
    }
  }

  /**
   * Finds all active journeys
   *
   * @param account - The owner of the workflows
   *
   */
  findAllActive(account: Account): Promise<Journey[]> {
    return this.journeysRepository.find({
      where: {
        owner: { id: account.id },
        isActive: true,
        isStopped: false,
        isPaused: false,
      },
    });
  }

  /**
   *
   * Find a journey by id, using db transactoins
   *
   * @param {Account} account
   * @param {string} id
   * @param {string} session
   * @param {QueryRunner} [queryRunner]
   */
  async findByID(
    account: Account,
    id: string,
    session: string,
    queryRunner?: QueryRunner
  ) {
    if (queryRunner)
      return await queryRunner.manager.findOne(Journey, {
        where: {
          owner: { id: account.id },
          id,
        },
      });
    else
      return await this.journeysRepository.findOne({
        where: {
          owner: { id: account.id },
          id,
        },
      });
  }

  /**
   * Finds a journey by ID.
   *
   * @param account
   * @param id
   * @param needStats
   * @param session
   * @returns
   */
  async findOne(account: Account, id: string, session: string): Promise<any> {
    if (!isUUID(id)) throw new BadRequestException('Id is not valid uuid');

    let found: Journey;
    try {
      found = await this.journeysRepository.findOne({
        where: {
          owner: { id: account.id },
          id,
        },
      });

      return Promise.resolve({
        name: found.name,
        nodes: found.visualLayout.nodes,
        edges: found.visualLayout.edges,
        segments: found.inclusionCriteria,
        isDynamic: found.isDynamic,
        isActive: found.isActive,
        isPaused: found.isPaused,
        isStopped: found.isStopped,
        isDeleted: found.isDeleted,
        journeyEntrySettings: found.journeyEntrySettings,
        journeySettings: found.journeySettings,
      });
    } catch (err) {
      this.error(err, this.findOne.name, session, account.email);
      throw err;
    }
  }

  /**
   * Mark a journey as deleted.
   * @param account
   * @param id
   * @param session
   * @returns
   */

  async markDeleted(account: Account, id: string, session: string) {
    try {
      return await this.journeysRepository.update(
        {
          owner: { id: account.id },
          id: id,
        },
        {
          isActive: false,
          isDeleted: true,
          isPaused: true,
          isStopped: true,
        }
      );
    } catch (err) {
      this.error(err, this.markDeleted.name, session, account.email);
      throw err;
    }
  }

  /**
   * Pause a journey.
   * @param account
   * @param id
   * @param value
   * @param session
   * @param queryRunner
   * @returns
   */
  async setPaused(
    account: Account,
    id: string,
    value: boolean,
    session: string
  ) {
    try {
      const found: Journey = await this.journeysRepository.findOneBy({
        owner: { id: account.id },
        id,
      });
      if (found?.isStopped)
        throw new HttpException('The Journey has already been stopped.', 400);
      if (!found?.isActive)
        throw new HttpException('The Journey has not been started yet.', 400);
      if (found?.isDeleted)
        throw new HttpException('The Journey has already been deleted', 400);
      if (value) {
        found.latestPause = new Date();
      } else {
        found.latestPause = null;
      }
      return await this.journeysRepository.save({
        ...found,
        isPaused: value,
      });
    } catch (error) {
      this.error(error, this.setPaused.name, session, account.email);
      throw error;
    }
  }

  /**
   * Start a journey.
   * @param account
   * @param workflowID
   * @param session
   * @returns
   */
  async start(
    account: Account,
    journeyID: string,
    session: string,
    runner?: QueryRunner
  ) {
    let journey: Journey; // Workflow to update
    this.debug(
      `${JSON.stringify({ account, journeyID })}`,
      this.start.name,
      session,
      account.email
    );
    let queryRunner = runner;
    const transactionSession = await this.connection.startSession();
    transactionSession.startTransaction();
    if (!runner) {
      queryRunner = this.dataSource.createQueryRunner();
      await queryRunner.connect();
      await queryRunner.startTransaction();
    }
    try {
      if (!account) throw new HttpException('User not found', 404);

      journey = await queryRunner.manager.findOne(Journey, {
        where: {
          owner: { id: account?.id },
          id: journeyID,
        },
      });
      if (!journey) {
        throw new Error(errors.ERROR_DOES_NOT_EXIST);
      }

      if (journey.isActive || journey.isStopped || journey.isDeleted) {
        throw new Error('This journey is no longer editable.');
      }

      if (!journey.inclusionCriteria)
        throw new Error('To start journey a filter should be defined');

      this.debug(
        `${JSON.stringify({ journey })}`,
        this.start.name,
        session,
        account.email
      );

      const graph = new Graph();
      const steps = await this.stepsService.transactionalfindByJourneyID(
        account,
        journey.id,
        queryRunner
      );

      this.debug(
        `${JSON.stringify({ steps: steps })}`,
        this.start.name,
        session,
        account.email
      );

      for (let i = 0; i < steps.length; i++) {
        graph.setNode(steps[i].id);
        if (
          steps[i].metadata?.branches &&
          steps[i].type !== StepType.WAIT_UNTIL_BRANCH
        ) {
          for (let j = 0; j < steps[i].metadata.branches.length; j++) {
            graph.setEdge(
              steps[i].id,
              steps[i].metadata.branches[j].destination
            );
          }
        } else if (
          steps[i].metadata?.destination &&
          steps[i].type !== StepType.TIME_DELAY &&
          steps[i].type !== StepType.TIME_WINDOW
        ) {
          graph.setEdge(steps[i].id, steps[i].metadata.destination);
        }
      }
      if (!alg.isAcyclic(graph))
        throw new Error('Flow has infinite loops, cannot start.');

      const audienceSize = await this.customersService.getAudienceSize(
        account,
        journey.inclusionCriteria,
        session,
        transactionSession
      );

      if (
        journey.journeyEntrySettings.entryTiming.type ===
          EntryTiming.WhenPublished ||
        journey.isRecurrence
      ) {
        await this.stepsService.triggerStart(
          account,
          journeyID,
          journey.inclusionCriteria,
          audienceSize,
          queryRunner,
          session
        );
      }

      // TODO: update to remove dev mode on start
      // await this.

      await queryRunner.manager.save(Journey, {
        ...journey,
        isActive: true,
        startedAt: new Date(Date.now()),
      });

      await transactionSession.commitTransaction();
      if (!runner) await queryRunner.commitTransaction();
    } catch (err) {
      await transactionSession.abortTransaction();
      if (!runner) await queryRunner.rollbackTransaction();
      this.logger.error('Error:  ' + err);
      throw err;
    } finally {
      await transactionSession.endSession();
      if (!runner) await queryRunner.release();
    }
  }

  /**
   * Stops a journey.
   * @param account
   * @param id
   * @param session
   * @returns
   */
  async stop(
    account: Account,
    id: string,
    session: string,
    queryRunner?: QueryRunner
  ) {
    if (!queryRunner) {
      const found: Journey = await this.journeysRepository.findOneBy({
        owner: { id: account.id },
        id,
      });
      if (!found?.isActive)
        throw new HttpException('The workflow was not activated', 400);
      await this.journeysRepository.save({
        ...found,
        isStopped: true,
        isActive: false,
        isPaused: true,
      });
    } else {
      const found: Journey = await queryRunner.manager.findOneBy(Journey, {
        owner: { id: account.id },
        id,
      });
      if (!found?.isActive)
        throw new HttpException('The workflow was not activated', 400);
      await queryRunner.manager.save(Journey, {
        ...found,
        isStopped: true,
        isActive: false,
        isPaused: true,
      });
    }
  }

  /**
   * Update a journey using a DB transaction
   * @param account
   * @param updateJourneyDto
   * @param session
   * @param queryRunner
   * @returns
   */
  async transactionalUpdate(
    account: Account,
    updateJourneyDto: UpdateJourneyDto,
    session: string,
    queryRunner: QueryRunner
  ): Promise<Journey> {
    try {
      const journey = await queryRunner.manager.findOne(Journey, {
        where: {
          id: updateJourneyDto.id,
        },
      });

      if (!journey) throw new NotFoundException('Journey not found');
      if (journey.isActive || journey.isDeleted || journey.isPaused)
        throw new Error('Journey is no longer editable.');

      const {
        visualLayout,
        isDynamic,
        name,
        inclusionCriteria,
        journeyEntrySettings,
        journeySettings,
        isRecurrence,
        recurrenceCount,
        recurrenceTimestamp,
        recurrenceId,
      } = updateJourneyDto;

      return await queryRunner.manager.save(Journey, {
        ...journey,
        visualLayout,
        isDynamic,
        name,
        inclusionCriteria,
        journeyEntrySettings,
        journeySettings,
        isRecurrence,
        recurrenceCount,
        recurrenceId,
        recurrenceTimestamp,
      });
    } catch (e) {
      this.error(e, this.update.name, session, account.email);
      throw e;
    }
  }

  /**
   * Update a journey.
   * @param account
   * @param updateJourneyDto
   * @param session
   * @returns
   */
  async update(
    account: Account,
    updateJourneyDto: UpdateJourneyDto,
    session: string
  ): Promise<Journey> {
    try {
      const journey = await this.journeysRepository.findOne({
        where: {
          id: updateJourneyDto.id,
        },
      });

      if (!journey) throw new NotFoundException('Journey not found');
      if (journey.isActive || journey.isDeleted || journey.isPaused)
        throw new Error('Journey is no longer editable.');

      const {
        isDynamic,
        name,
        inclusionCriteria,
        journeyEntrySettings,
        journeySettings,
      } = updateJourneyDto;

      return await this.journeysRepository.save({
        ...journey,
        isDynamic,
        name,
        inclusionCriteria,
        journeyEntrySettings,
        journeySettings,
      });
    } catch (e) {
      this.error(e, this.update.name, session, account.email);
      throw e;
    }
  }

  /**
   * Update a journey.
   * @param account
   * @param updateJourneyDto
   * @param session
   * @returns
   */
  async updateLayout(
    account: Account,
    updateJourneyDto: UpdateJourneyLayoutDto,
    session: string
  ): Promise<Journey> {
    const queryRunner = this.dataSource.createQueryRunner();
    queryRunner.startTransaction();
    let err;
    try {
      let journey = await queryRunner.manager.findOne(Journey, {
        where: {
          id: updateJourneyDto.id,
        },
      });

      if (!journey) throw new NotFoundException('Journey not found');
      if (journey.isActive || journey.isDeleted || journey.isPaused)
        throw new Error('Journey is no longer editable.');

      const { nodes, edges } = updateJourneyDto;
      this.debug(
        JSON.stringify({ nodes, edges }),
        this.updateLayout.name,
        session,
        account.email
      );

      for (let i = 0; i < nodes.length; i++) {
        const step = await queryRunner.manager.findOne(Step, {
          where: {
            id: nodes[i].data.stepId,
          },
        });
        const relevantEdges = edges.filter((edge) => {
          return edge.source === nodes[i].id;
        });
        let metadata;
        switch (nodes[i].type) {
          case NodeType.START:
            if (relevantEdges.length > 1)
              throw new Error(
                'Cannot have more than one branch for Start Step'
              );
            metadata = new StartStepMetadata();
            metadata.destination = nodes.filter((node) => {
              return node.id === relevantEdges[0].target;
            })[0].data.stepId;
            break;
          case NodeType.EMPTY:
            break;
          case NodeType.MESSAGE:
            if (relevantEdges.length > 1)
              throw new Error(
                'Cannot have more than one branch for Message Step'
              );
            metadata = new MessageStepMetadata();
            metadata.destination = nodes.filter((node) => {
              return node.id === relevantEdges[0].target;
            })[0].data.stepId;
            metadata.channel = nodes[i].data['template']['type'];
            metadata.customName = nodes[i].data['customName'] || 'Unknown name';
            if (nodes[i].data['template']['selected'])
              metadata.template = nodes[i].data['template']['selected']['id'];
            this.debug(
              JSON.stringify({ startMetadata: metadata }),
              this.updateLayout.name,
              account.email,
              session
            );
            break;
          case NodeType.TRACKER:
            if (relevantEdges.length > 1) {
              throw new Error(
                'Cannot have more than one branch for Custom Component Step'
              );
            }
            metadata = new CustomComponentStepMetadata();
            metadata.destination = nodes.filter((node) => {
              return node.id === relevantEdges[0].target;
            })[0].data.stepId;
            if (nodes[i].data['tracker']) {
              if (nodes[i].data['tracker']['trackerTemplate']) {
                metadata.template =
                  nodes[i].data['tracker']['trackerTemplate']['id'];
              }
              metadata.action = nodes[i].data['tracker']['visibility'];
              metadata.humanReadableName =
                nodes[i].data['tracker']['trackerId'];
              metadata.pushedValues = {} as Record<string, any>;
              nodes[i].data['tracker']['fields'].forEach((field) => {
                metadata.pushedValues[field.name] = field.value;
              });
            }
            this.debug(
              JSON.stringify({ trackerMetadata: metadata }),
              this.updateLayout.name,
              account.email,
              session
            );
            break;
          case NodeType.WAIT_UNTIL:
            metadata = new WaitUntilStepMetadata();

            //Time Branch configuration
            const timeBranch = nodes[i].data['branches'].filter((branch) => {
              return branch.type === BranchType.MAX_TIME;
            })[0];
            if (timeBranch?.timeType === TimeType.TIME_DELAY) {
              metadata.timeBranch = new TimeDelayStepMetadata();
              metadata.timeBranch.delay = new Temporal.Duration(
                timeBranch.delay.years,
                timeBranch['delay']['months'],
                timeBranch['delay']['weeks'],
                timeBranch['delay']['days'],
                timeBranch['delay']['hours'],
                timeBranch['delay']['minutes']
              );
            } else if (timeBranch?.timeType === TimeType.TIME_WINDOW) {
              metadata.timeBranch = new TimeWindowStepMetadata();
              metadata.timeBranch.window = new TimeWindow();
              metadata.timeBranch.window.from = Temporal.Instant.from(
                new Date(timeBranch['waitFrom']).toISOString()
              );
              metadata.timeBranch.window.to = Temporal.Instant.from(
                new Date(timeBranch['waitTo']).toISOString()
              );
            }
            metadata.branches = [];
            for (let i = 0; i < relevantEdges.length; i++) {
              if (relevantEdges[i].data['branch'].type === BranchType.MAX_TIME)
                metadata.timeBranch.destination = nodes.filter((node) => {
                  return node.id === relevantEdges[i].target;
                })[0].data.stepId;
              else if (
                relevantEdges[i].data['branch'].type === BranchType.EVENT
              ) {
                const branch = new EventBranch();
                branch.events = [];
                branch.relation =
                  relevantEdges[i].data['branch'].conditions[0].relationToNext;
                branch.index = i;
                branch.destination = nodes.filter((node) => {
                  return node.id === relevantEdges[i].target;
                })[0].data.stepId;
                for (
                  let eventsIndex = 0;
                  eventsIndex <
                  relevantEdges[i].data['branch'].conditions.length;
                  eventsIndex++
                ) {
                  let event;
                  if (
                    relevantEdges[i].data['branch'].conditions[eventsIndex]
                      .providerType === ProviderType.Tracker
                  ) {
                    event = new ComponentEvent();
                    event.event =
                      relevantEdges[i].data['branch'].conditions[
                        eventsIndex
                      ].event;
                    event.trackerID =
                      relevantEdges[i].data['branch'].conditions[
                        eventsIndex
                      ].trackerId;
                  } else {
                    event = new AnalyticsEvent();
                    event.conditions = [];
                    event.event =
                      relevantEdges[i].data['branch'].conditions[
                        eventsIndex
                      ].name;
                    event.provider =
                      relevantEdges[i].data['branch'].conditions[
                        eventsIndex
                      ].providerType;
                    event.relation =
                      relevantEdges[i].data['branch'].conditions[
                        eventsIndex
                      ].statements[0]?.relationToNext;
                    for (
                      let conditionsIndex = 0;
                      conditionsIndex <
                      relevantEdges[i].data['branch'].conditions[eventsIndex]
                        .statements.length;
                      conditionsIndex++
                    ) {
                      const condition = new AnalyticsEventCondition();
                      condition.type =
                        relevantEdges[i].data['branch'].conditions[
                          eventsIndex
                        ].statements[conditionsIndex].type;
                      if (condition.type === FilterByOption.ELEMENTS) {
                        condition.elementCondition = new ElementCondition();
                        condition.elementCondition.comparisonType =
                          relevantEdges[i].data['branch'].conditions[
                            eventsIndex
                          ].statements[conditionsIndex].comparisonType;
                        condition.elementCondition.filter =
                          relevantEdges[i].data['branch'].conditions[
                            eventsIndex
                          ].statements[conditionsIndex].elementKey;
                        condition.elementCondition.filterType =
                          relevantEdges[i].data['branch'].conditions[
                            eventsIndex
                          ].statements[conditionsIndex].valueType;
                        condition.elementCondition.order =
                          relevantEdges[i].data['branch'].conditions[
                            eventsIndex
                          ].statements[conditionsIndex].order;
                        condition.elementCondition.value =
                          relevantEdges[i].data['branch'].conditions[
                            eventsIndex
                          ].statements[conditionsIndex].value;
                      } else {
                        condition.propertyCondition = new PropertyCondition();
                        condition.propertyCondition.comparisonType =
                          relevantEdges[i].data['branch'].conditions[
                            eventsIndex
                          ].statements[conditionsIndex].comparisonType;
                        condition.propertyCondition.key =
                          relevantEdges[i].data['branch'].conditions[
                            eventsIndex
                          ].statements[conditionsIndex].key;
                        condition.propertyCondition.keyType =
                          relevantEdges[i].data['branch'].conditions[
                            eventsIndex
                          ].statements[conditionsIndex].valueType;
                        condition.propertyCondition.value =
                          relevantEdges[i].data['branch'].conditions[
                            eventsIndex
                          ].statements[conditionsIndex].value;
                      }
                      event.conditions.push(condition);
                    }
                  }
                  branch.events.push(event);
                }
                metadata.branches.push(branch);
              }
            }
            if (nodes[i].id === '226a7112-96ec-477d-a1ac-d604b4f04301') {
              this.logger.warn('SAVE TEST 3 After processing');
              this.logger.warn(journey);
            }
            break;
          case NodeType.JUMP_TO:
            metadata = new LoopStepMetadata();
            metadata.destination = nodes.filter((node) => {
              return node.id === nodes[i]?.data?.targetId;
            })[0]?.data?.stepId;
            break;
          case NodeType.EXIT:
            if (relevantEdges.length > 0)
              throw new Error('Cannot have any branches for Exit Step');
            metadata = new ExitStepMetadata();
            this.debug(
              JSON.stringify({ exitMetadata: metadata }),
              this.updateLayout.name,
              account.email,
              session
            );
            break;
          case NodeType.TIME_DELAY:
            if (relevantEdges.length > 1)
              throw new Error(
                'Cannot have more than one branch for Time Delay Step'
              );
            metadata = new TimeDelayStepMetadata();
            metadata.destination = nodes.filter((node) => {
              return node.id === relevantEdges[0].target;
            })[0].data.stepId;
            metadata.delay = new Temporal.Duration(
              nodes[i].data['delay']['years'],
              nodes[i].data['delay']['months'],
              nodes[i].data['delay']['weeks'],
              nodes[i].data['delay']['days'],
              nodes[i].data['delay']['hours'],
              nodes[i].data['delay']['minutes']
            );
            break;
          case NodeType.TIME_WINDOW:
            if (relevantEdges.length > 1)
              throw new Error(
                'Cannot have more than one branch for Time Window Step'
              );
            metadata = new TimeWindowStepMetadata();
            metadata.destination = nodes.filter((node) => {
              return node.id === relevantEdges[0].target;
            })[0].data.stepId;
            metadata.window = new TimeWindow();
            if (
              nodes[i].data?.['windowType'] === undefined ||
              nodes[i].data['windowType'] === TimeWindowTypes.SPEC_DATES
            ) {
              if (nodes[i].data['from'])
                metadata.window.from = Temporal.Instant.from(
                  new Date(nodes[i].data['from']).toISOString()
                );
              if (nodes[i].data['to'])
                metadata.window.to = Temporal.Instant.from(
                  new Date(nodes[i].data['to']).toISOString()
                );
            } else if (
              nodes[i].data['windowType'] === TimeWindowTypes.SPEC_WEEK_DAYS
            ) {
              if (nodes[i].data['onDays'])
                metadata.window.onDays = nodes[i].data?.['onDays'];

              if (nodes[i].data['fromTime'])
                metadata.window.fromTime = nodes[i].data?.['fromTime'];

              if (nodes[i].data['toTime'])
                metadata.window.toTime = nodes[i].data?.['toTime'];
            }
            break;
          case NodeType.MULTISPLIT:
            metadata = new AttributeSplitMetadata();
            metadata.branches = [];
            for (let i = 0; i < relevantEdges.length; i++) {
              // All others branch check
              if (relevantEdges[i].data['branch'].isOthers === true) {
                metadata.allOthers = nodes.filter((node) => {
                  return node.id === relevantEdges[i].target;
                })[0].data.stepId;
              } else {
                const branch = new AttributeConditions();
                branch.destination = nodes.filter((node) => {
                  return node.id === relevantEdges[i].target;
                })[0].data.stepId;
                branch.index = i;
                branch.conditions =
                  relevantEdges[i].data['branch']['conditions'];
                branch.destination = nodes.filter((node) => {
                  return node.id === relevantEdges[i].target;
                })[0].data.stepId;
                metadata.branches.push(branch);
              }
            }
            break;
        }
        await queryRunner.manager.save(Step, {
          ...step,
          metadata,
        });
      }

      journey = await queryRunner.manager.save(Journey, {
        ...journey,
        visualLayout: {
          nodes,
          edges,
        },
      });
      await queryRunner.commitTransaction();
      return Promise.resolve(journey);
    } catch (e) {
      this.error(e, this.updateLayout.name, session, account.email);
      err = e;
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
      if (err) throw err;
    }
  }

  /**
   * Update a journey.
   * @param account
   * @param updateJourneyDto
   * @param session
   * @returns
   */
  async updateLayoutTransactional(
    account: Account,
    updateJourneyDto: UpdateJourneyLayoutDto,
    queryRunner: QueryRunner,
    session: string
  ): Promise<Journey> {
    let journey = await queryRunner.manager.findOne(Journey, {
      where: {
        id: updateJourneyDto.id,
      },
    });

    if (!journey) throw new NotFoundException('Journey not found');
    if (journey.isActive || journey.isDeleted || journey.isPaused)
      throw new Error('Journey is no longer editable.');

    const { nodes, edges } = updateJourneyDto;
    for (let i = 0; i < nodes.length; i++) {
      const step = await queryRunner.manager.findOne(Step, {
        where: {
          id: nodes[i].data.stepId,
        },
      });
      const relevantEdges = edges.filter((edge) => {
        return edge.source === nodes[i].id;
      });
      let metadata;
      switch (nodes[i].type) {
        case NodeType.START:
          if (relevantEdges.length > 1)
            throw new Error('Cannot have more than one branch for Start Step');
          metadata = new StartStepMetadata();
          metadata.destination = nodes.filter((node) => {
            return node.id === relevantEdges[0].target;
          })[0].data.stepId;
          break;
        case NodeType.EMPTY:
          break;
        case NodeType.MESSAGE:
          if (relevantEdges.length > 1)
            throw new Error(
              'Cannot have more than one branch for Message Step'
            );
          metadata = new MessageStepMetadata();
          metadata.destination = nodes.filter((node) => {
            return node.id === relevantEdges[0].target;
          })[0].data.stepId;
          metadata.channel = nodes[i].data['template']['type'];
          if (nodes[i].data['template']['selected'])
            metadata.template = nodes[i].data['template']['selected']['id'];
          break;
        case NodeType.TRACKER:
          if (relevantEdges.length > 1) {
            throw new Error(
              'Cannot have more than one branch for Custom Component Step'
            );
          }
          metadata = new CustomComponentStepMetadata();
          metadata.destination = nodes.filter((node) => {
            return node.id === relevantEdges[0].target;
          })[0].data.stepId;
          if (nodes[i].data['tracker']) {
            if (nodes[i].data['tracker']['trackerTemplate']) {
              metadata.template =
                nodes[i].data['tracker']['trackerTemplate']['id'];
            }
            metadata.action = nodes[i].data['tracker']['visibility'];
            metadata.humanReadableName = nodes[i].data['tracker']['trackerId'];
            metadata.pushedValues = {} as Record<string, any>;
            nodes[i].data['tracker']['fields'].forEach((field) => {
              metadata.pushedValues[field.name] = field.value;
            });
          }
          this.debug(
            JSON.stringify({ trackerMetadata: metadata }),
            this.updateLayout.name,
            account.email,
            session
          );
          break;
        case NodeType.WAIT_UNTIL:
          metadata = new WaitUntilStepMetadata();

          //Time Branch configuration
          const timeBranch = nodes[i].data['branches'].filter((branch) => {
            return branch.type === BranchType.MAX_TIME;
          })[0];
          if (timeBranch?.timeType === TimeType.TIME_DELAY) {
            metadata.timeBranch = new TimeDelayStepMetadata();
            metadata.timeBranch.delay = new Temporal.Duration(
              timeBranch.delay.years,
              timeBranch['delay']['months'],
              timeBranch['delay']['weeks'],
              timeBranch['delay']['days'],
              timeBranch['delay']['hours'],
              timeBranch['delay']['minutes']
            );
          } else if (timeBranch?.timeType === TimeType.TIME_WINDOW) {
            metadata.timeBranch = new TimeWindowStepMetadata();
            metadata.timeBranch.window = new TimeWindow();
            metadata.timeBranch.window.from = Temporal.Instant.from(
              new Date(timeBranch['from']).toISOString()
            );
            metadata.timeBranch.window.to = Temporal.Instant.from(
              new Date(timeBranch['to']).toISOString()
            );
          }
          metadata.branches = [];
          for (let i = 0; i < relevantEdges.length; i++) {
            if (relevantEdges[i].data['branch'].type === BranchType.MAX_TIME)
              metadata.timeBranch.destination = nodes.filter((node) => {
                return node.id === relevantEdges[i].target;
              })[0].data.stepId;
            else if (
              relevantEdges[i].data['branch'].type === BranchType.EVENT
            ) {
              const branch = new EventBranch();
              branch.events = [];
              branch.relation =
                relevantEdges[i].data['branch'].conditions[0].relationToNext;
              branch.index = i;
              branch.destination = nodes.filter((node) => {
                return node.id === relevantEdges[i].target;
              })[0].data.stepId;
              for (
                let eventsIndex = 0;
                eventsIndex < relevantEdges[i].data['branch'].conditions.length;
                eventsIndex++
              ) {
                let event;
                if (
                  relevantEdges[i].data['branch'].conditions[eventsIndex]
                    .providerType === ProviderType.Tracker
                ) {
                  event = new ComponentEvent();
                  event.event =
                    relevantEdges[i].data['branch'].conditions[
                      eventsIndex
                    ].event;
                  event.trackerID =
                    relevantEdges[i].data['branch'].conditions[
                      eventsIndex
                    ].trackerId;
                } else {
                  event = new AnalyticsEvent();
                  event.conditions = [];
                  event.event =
                    relevantEdges[i].data['branch'].conditions[
                      eventsIndex
                    ].name;
                  event.provider =
                    relevantEdges[i].data['branch'].conditions[
                      eventsIndex
                    ].providerType;
                  event.relation =
                    relevantEdges[i].data['branch'].conditions[
                      eventsIndex
                    ].statements[0]?.relationToNext;
                  for (
                    let conditionsIndex = 0;
                    conditionsIndex <
                    relevantEdges[i].data['branch'].conditions[eventsIndex]
                      .statements.length;
                    conditionsIndex++
                  ) {
                    const condition = new AnalyticsEventCondition();
                    condition.type =
                      relevantEdges[i].data['branch'].conditions[
                        eventsIndex
                      ].statements[conditionsIndex].type;
                    if (condition.type === FilterByOption.ELEMENTS) {
                      condition.elementCondition = new ElementCondition();
                      condition.elementCondition.comparisonType =
                        relevantEdges[i].data['branch'].conditions[
                          eventsIndex
                        ].statements[conditionsIndex].comparisonType;
                      condition.elementCondition.filter =
                        relevantEdges[i].data['branch'].conditions[
                          eventsIndex
                        ].statements[conditionsIndex].elementKey;
                      condition.elementCondition.filterType =
                        relevantEdges[i].data['branch'].conditions[
                          eventsIndex
                        ].statements[conditionsIndex].valueType;
                      condition.elementCondition.order =
                        relevantEdges[i].data['branch'].conditions[
                          eventsIndex
                        ].statements[conditionsIndex].order;
                      condition.elementCondition.value =
                        relevantEdges[i].data['branch'].conditions[
                          eventsIndex
                        ].statements[conditionsIndex].value;
                    } else {
                      condition.propertyCondition = new PropertyCondition();
                      condition.propertyCondition.comparisonType =
                        relevantEdges[i].data['branch'].conditions[
                          eventsIndex
                        ].statements[conditionsIndex].comparisonType;
                      condition.propertyCondition.key =
                        relevantEdges[i].data['branch'].conditions[
                          eventsIndex
                        ].statements[conditionsIndex].key;
                      condition.propertyCondition.keyType =
                        relevantEdges[i].data['branch'].conditions[
                          eventsIndex
                        ].statements[conditionsIndex].valueType;
                      condition.propertyCondition.value =
                        relevantEdges[i].data['branch'].conditions[
                          eventsIndex
                        ].statements[conditionsIndex].value;
                    }
                    event.conditions.push(condition);
                  }
                }
                branch.events.push(event);
              }
              metadata.branches.push(branch);
            }
          }
          break;
        case NodeType.JUMP_TO:
          metadata = new LoopStepMetadata();
          metadata.destination = nodes.filter((node) => {
            return node.id === nodes[i]?.data?.targetId;
          })[0]?.data?.stepId;
          break;
        case NodeType.EXIT:
          if (relevantEdges.length > 0)
            throw new Error('Cannot have any branches for Exit Step');
          metadata = new ExitStepMetadata();
          break;
        case NodeType.TIME_DELAY:
          if (relevantEdges.length > 1)
            throw new Error(
              'Cannot have more than one branch for Time Delay Step'
            );
          metadata = new TimeDelayStepMetadata();
          metadata.destination = nodes.filter((node) => {
            return node.id === relevantEdges[0].target;
          })[0].data.stepId;
          metadata.delay = new Temporal.Duration(
            nodes[i].data['delay']['years'],
            nodes[i].data['delay']['months'],
            nodes[i].data['delay']['weeks'],
            nodes[i].data['delay']['days'],
            nodes[i].data['delay']['hours'],
            nodes[i].data['delay']['minutes']
          );
          break;
        case NodeType.TIME_WINDOW:
          if (relevantEdges.length > 1)
            throw new Error(
              'Cannot have more than one branch for Time Window Step'
            );
          metadata = new TimeWindowStepMetadata();
          metadata.destination = nodes.filter((node) => {
            return node.id === relevantEdges[0].target;
          })[0].data.stepId;
          metadata.window = new TimeWindow();
          metadata.window.from = Temporal.Instant.from(
            new Date(nodes[i].data['from']).toISOString()
          );
          metadata.window.to = Temporal.Instant.from(
            new Date(nodes[i].data['to']).toISOString()
          );
          break;
      }
      await queryRunner.manager.save(Step, {
        ...step,
        metadata,
      });
    }

    journey = await queryRunner.manager.save(Journey, {
      ...journey,
      visualLayout: {
        nodes,
        edges,
      },
    });
    return Promise.resolve(journey);
  }

  async getAllJourneyTags(account: Account, session: string): Promise<any> {
    try {
      const tags = await this.dataSource.query(
        `
      SELECT DISTINCT json_array_elements_text("journeySettings"::json->'tags') as tag
      FROM journey
      WHERE "journeySettings" is not null and "ownerId" = $1
      `,
        [account.id]
      );

      return tags.map((el) => el.tag);
    } catch (e) {
      this.error(e, this.getAllJourneyTags.name, session, account.email);
      throw e;
    }
  }

  async findAllMessages(
    account: Account,
    id: string,
    type: string,
    session: string
  ): Promise<any> {
    if (!isUUID(id)) throw new BadRequestException('Id is not valid uuid');
    try {
      const data = await this.dataSource.query(
        `
        SELECT id,metadata
        FROM step
        WHERE type = 'message'
          AND metadata is not null
          AND metadata::jsonb->>'channel' = $1
          AND metadata::jsonb->>'template' is not null
          AND "journeyId" = $2
          AND "ownerId" = $3
  `,
        [type, id, account.id]
      );

      return data;
    } catch (err) {
      this.error(err, this.findAllMessages.name, session, account.email);
      throw err;
    }
  }
}
