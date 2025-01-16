import {
  Logger,
  Inject,
  Injectable,
  HttpException,
  NotFoundException,
  forwardRef,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
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
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { isUUID } from 'class-validator';
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
  AttributeChangeEvent,
  AttributeConditions,
  Channel,
  ComponentEvent,
  CustomComponentStepMetadata,
  ElementCondition,
  EventBranch,
  MessageEvent,
  PropertyCondition,
  StartStepMetadata,
  StepType,
  TimeWindowTypes,
  ExperimentMetadata,
  ExperimentBranch,
} from '../steps/types/step.interface';
import { MessageStepMetadata } from '../steps/types/step.interface';
import { WaitUntilStepMetadata } from '../steps/types/step.interface';
import { LoopStepMetadata } from '../steps/types/step.interface';
import { ExitStepMetadata } from '../steps/types/step.interface';
import { TimeDelayStepMetadata } from '../steps/types/step.interface';
import { TimeWindow } from '../steps/types/step.interface';
import { TimeWindowStepMetadata } from '../steps/types/step.interface';
import { AttributeSplitMetadata } from '../steps/types/step.interface';
import { Temporal } from '@js-temporal/polyfill';
import generateName from '@good-ghosting/random-name-generator';
import {
  EntryTiming,
  JourneyEnrollmentType,
} from './types/additional-journey-settings.interface';
import { JourneyLocationsService } from './journey-locations.service';
import { Queue } from 'bullmq';
import { RedisService } from '@liaoliaots/nestjs-redis';
import { JourneyChange } from './entities/journey-change.entity';
import isObjectDeepEqual from '../../utils/isObjectDeepEqual';
import { JourneyLocation } from './entities/journey-location.entity';
import { eachDayOfInterval, eachWeekOfInterval } from 'date-fns';
import { CacheService } from '../../common/services/cache.service';
import { EntityComputedFieldsHelper } from '../../common/helper/entityComputedFields.helper';
import { EntityWithComputedFields } from '../../common/entities/entityWithComputedFields.entity';
import { QueueType } from '../../common/services/queue/types/queue-type';
import { Producer } from '../../common/services/queue/classes/producer';
import { Segment, SegmentType } from '../segments/entities/segment.entity';
import { Customer } from '../customers/entities/customer.entity';
import { CustomerKeysService } from '../customers/customer-keys.service';
import { CacheConstants } from '../../common/services/cache.constants';
import { JourneyStatisticsService } from './journey-statistics.service';

export enum JourneyStatus {
  ACTIVE = 'Active',
  ENROLLING = 'Enrolling',
  PAUSED = 'Paused',
  STOPPED = 'Stopped',
  DELETED = 'Deleted',
  DRAFT = 'Draft',
}

enum ActivityEventType {
  JOURNEY = 'journey',
  ENTRY = 'entry',
  SETTINGS = 'settings',
}

enum JourneyChangeType {
  PUBLISH = 'publish',
  PAUSE = 'pause',
  RESUME = 'resume',
  STOP = 'stop',
  DELETE = 'delete',
  RESTORE = 'restore',
  EDIT_SAVE = 'edit-save',
  EDIT_PUBLISH = 'edit-publish',
}

enum EntryChangeType {
  ENTRY_TIMING = 'entry-timing',
  ENTRY_TYPE = 'entry-type',
  ELIGIBLE_USERS = 'eligible-users',
}

enum SettingsChangeType {
  ADD_TAG = 'add-tag',
  DELETE_TAG = 'delete-tag',
  ENABLE_QUIETE_HOURS = 'enable-qh',
  CHANGE_QUIETE_HOURS = 'change-qh',
  DISABLE_QUIETE_HOURS = 'disable-qh',
  ENABLE_MAX_USER_ENTRIES = 'enable-max-user',
  CHANGE_MAX_USER_ENTRIES = 'change-max-user',
  DISABLE_MAX_USER_ENTRIES = 'disable-max-user',
  ENABLE_MAX_MESSAGE_SENDS = 'enable-max-message',
  CHANGE_MAX_MESSAGE_SENDS = 'change-max-message',
  DISABLE_MAX_MESSAGE_SENDS = 'disable-max-message',
}

type ChangeType = JourneyChangeType | EntryChangeType | SettingsChangeType;

type UndetailedChangeType =
  | JourneyChangeType.PAUSE
  | JourneyChangeType.RESUME
  | JourneyChangeType.STOP
  | JourneyChangeType.DELETE
  | JourneyChangeType.EDIT_SAVE
  | SettingsChangeType.DISABLE_QUIETE_HOURS
  | SettingsChangeType.DISABLE_MAX_USER_ENTRIES
  | SettingsChangeType.DISABLE_MAX_MESSAGE_SENDS;

interface UndetailedChange {
  type: UndetailedChangeType;
}

interface NameDetailedChange {
  type: JourneyChangeType.PUBLISH | JourneyChangeType.EDIT_PUBLISH;
  name: string;
}

interface RestoreChange {
  type: JourneyChangeType.RESTORE;
  name1: string;
  name2: string;
}

interface EntryTimingChange {
  type: EntryChangeType.ENTRY_TIMING;
  entryTiming: any;
}

interface EntryTypeChange {
  type: EntryChangeType.ENTRY_TYPE;
  entryType: JourneyEnrollmentType;
}

interface EligibleUsersChange {
  type: EntryChangeType.ELIGIBLE_USERS;
  inclusionCriteria: any;
}

interface TagChange {
  type: SettingsChangeType.ADD_TAG | SettingsChangeType.DELETE_TAG;
  tag: string;
}

interface QuietHoursChange {
  type:
  | SettingsChangeType.ENABLE_QUIETE_HOURS
  | SettingsChangeType.CHANGE_QUIETE_HOURS;
  quietHours: any;
}

interface MaxUserEntriesChange {
  type:
  | SettingsChangeType.ENABLE_MAX_USER_ENTRIES
  | SettingsChangeType.CHANGE_MAX_USER_ENTRIES;
  maxUserEntries: any;
}

interface MaxMessageSendsChange {
  type:
  | SettingsChangeType.ENABLE_MAX_MESSAGE_SENDS
  | SettingsChangeType.CHANGE_MAX_MESSAGE_SENDS;
  maxMessageSends: any;
}

type Change =
  | UndetailedChange
  | NameDetailedChange
  | RestoreChange
  | EntryTimingChange
  | EntryTypeChange
  | EligibleUsersChange
  | TagChange
  | QuietHoursChange
  | MaxUserEntriesChange
  | MaxMessageSendsChange;

export interface ActivityEvent {
  date: string;
  type: ActivityEventType;
  changerEmail: string;
  changes: Change[];
}

@Injectable()
export class JourneysService {
  constructor(
    private dataSource: DataSource,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @InjectRepository(Journey)
    public journeysRepository: Repository<Journey>,
    @InjectRepository(JourneyChange)
    public journeyChangesRepository: Repository<JourneyChange>,
    @Inject(StepsService) private stepsService: StepsService,
    @Inject(forwardRef(() => CustomersService))
    private customersService: CustomersService,
    @Inject(forwardRef(() => CustomerKeysService))
    private customerKeysService: CustomerKeysService,
    @Inject(JourneyLocationsService)
    private readonly journeyLocationsService: JourneyLocationsService,
    @Inject(RedisService) private redisService: RedisService,
    @Inject(CacheService) private cacheService: CacheService,
    @Inject(JourneyStatisticsService) private journeyStatisticsService: JourneyStatisticsService
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
   * Gets all journeys associated with a user.
   *
   * @param account
   * @param name
   * @param session
   * @returns
   */
  async getJourneys(account: Account, session: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const journeys = await queryRunner.manager.find(Journey, {
        where: {
          workspace: {
            id: account.teams?.[0]?.organization?.workspaces?.[0].id,
          },
        },
      });

      // Map each Journey object to its id
      const journeyIds = journeys.map((journey) => journey.id);

      // Commit the transaction before returning the data
      await queryRunner.commitTransaction();

      return journeyIds;
    } catch (error) {
      // Handle any errors that occur during the transaction
      await queryRunner.rollbackTransaction();
      throw error;
    } finally {
      // Release the query runner which will return it to the connection pool
      await queryRunner.release();
    }
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
      const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

      const journey = await this.journeysRepository.create({
        name,
        workspace: workspace,
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
    session: string
  ) {
    account = await queryRunner.manager.findOne(Account, {
      where: { id: account.id },
      relations: ['teams.organization.workspaces'],
    });

    try {
      const startNodeUUID = uuid();
      const nextNodeUUID = uuid();

      const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

      const journey = await queryRunner.manager.create(Journey, {
        name,
        workspace: {
          id: workspace.id,
        },
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

    const workspace = user.teams?.[0]?.organization?.workspaces?.[0];
    try {
      const oldJourney = await queryRunner.manager.findOne(Journey, {
        where: {
          workspace: {
            id: workspace.id,
          },
          id,
        },
      });
      if (!oldJourney) throw new NotFoundException('Journey not found');

      let copyEraseIndex = oldJourney.name.indexOf('-copy');
      if (copyEraseIndex === -1) copyEraseIndex = oldJourney.name.length;

      const res = await queryRunner.manager
        .createQueryBuilder(Journey, 'journey')
        .select('COUNT(*)')
        .where(
          'starts_with(name, :oldName) = TRUE AND "workspaceId" = :workspaceId',
          {
            oldName: oldJourney.name.substring(0, copyEraseIndex),
            workspaceId: workspace.id,
          }
        )
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
              workspace: oldStep.workspace,
              type: oldStep.type,
              journey: newJourney,
              customers: [],
              isEditable: true,
            };
          })
      );

      newSteps.splice(startIndex, 0, startStep[0]);

      let visualLayout: any = JSON.stringify(oldJourney.visualLayout);

      // console.log('\n\n\n\n', workspace, oldJourney);

      for (let i = 0; i < oldSteps.length; i++) {
        const oldStepID = oldSteps[i]?.id;
        const newStepID = newSteps[i]?.id;

        visualLayout = visualLayout.replaceAll(oldStepID, newStepID);
        if (oldSteps[i].type === StepType.TRACKER) {
          const newStepName = generateName({ number: true }).dashed;
          const oldStepName = oldSteps[i]?.metadata?.humanReadableName;

          if (oldStepName)
            visualLayout = visualLayout.replaceAll(oldStepName, newStepName);
        }
      }

      visualLayout = JSON.parse(visualLayout);
      await this.updateLayout(
        user,
        {
          id: newJourney.id,
          nodes: visualLayout.nodes,
          edges: visualLayout.edges,
        },
        session,
        queryRunner,
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
  ) {
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

    const journeys = await queryRunner.manager.find(Journey, {
      where: {
        workspace: {
          id: workspace.id,
        },
        isActive: true,
        isStopped: false,
        isPaused: false,
        // TODO_JH should we be checking for these? (should be updated to the proper check for "active/addable")
        isDynamic: true,
      },
    });
    const customer = await this.customersService.findByCustomerId(
      account,
      customerId,
    );
    for (const journey of journeys) {
      // get segments for journey
      let change: 'ADD' | 'REMOVE' | 'DO_NOTHING' = 'DO_NOTHING';
      const doesInclude =
        await this.customersService.isCustomerEnrolledInJourney(
          account,
          customer,
          journey,
          session,
          queryRunner
        );
      //let shouldInclude = true;
      // TODO_JH: implement the following
      const shouldInclude =
        await this.customersService.checkCustomerMatchesQuery(
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
        const journeyEntrySettings = journey.journeyEntrySettings ?? {
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
          await this.enrollCustomersInJourney(
            account,
            journey,
            [customer],
            [],
            session,
            queryRunner,
          );
          break;
        case 'REMOVE':
          await this.unenrollCustomerFromJourney(
            account,
            journey,
            customer,
            session,
          );
          break;
      }
    }
  }

  /**
   * Enroll customers in a journey.
   * Adds customer to first step in journey and adds customer to transition processor.
   * WARNING: this method does not check if the journey **should** include the customer.
   * NOTE: this method DOES check the rate limiting for unique enrolled customers.
   *
   */
  async enrollCustomersInJourney(
    account: Account,
    journey: Journey,
    customers: Customer[],
    locations: JourneyLocation[],
    session: string,
    queryRunner: QueryRunner,
  ): Promise<any[]> {
    const jobsData: any[] = [];

    const startStep = await this.stepsService.getStartStep(
      account,
      journey,
      session
    );

    // Construct a new journey object with an empty visualLayout, inclusionCriteria
    // to save space in job queue later
    const modifiedJourney: Journey = {
      ...journey,
      visualLayout: {
        edges: [],
        nodes: [],
      },
      inclusionCriteria: {},
    };
    // Prepare a deep copy of the account to modify without affecting the original account object
    const modifiedAccount = {
      ...account,
      teams: account.teams.map((team) => ({
        ...team,
        organization: {
          ...team.organization,
          workspaces: team.organization.workspaces.map((workspace) => ({
            ...workspace,
            pushConnections: [], //, Clears the pushConnections array
            //pushPlatforms: null // Clears the pushPlatforms info
          })),
        },
      })),
    };

    for (const customer of customers) {
      if (
        await this.rateLimitEntryByUniqueEnrolledCustomers(
          account,
          journey,
          queryRunner
        )
      ) {
        this.log(
          `Max customer limit reached on journey: ${journey.id}. Preventing customer: ${customer.id} from being enrolled.`,
          this.enrollCustomersInJourney.name,
          session,
          account.id
        );
        continue;
      }
      const jobData = {
        owner: modifiedAccount,
        journey: modifiedJourney,
        step: startStep,
        location: locations.find((location: JourneyLocation) => {
          return (
            location.customer.toString() === (customer.id ?? customer.id.toString()) &&
            location.journey === journey.id
          );
        }),
        session: session,
        customer,
        stepDepth: 1,
      };

      jobsData.push(jobData);
    }
    return jobsData;
  }

  /**
   * Un-Enroll Customer from journey and remove from any steps.
   */
  public async unenrollCustomerFromJourney(
    account: Account,
    journey: Journey,
    customer: Customer,
    session: string,
  ) {
    // TODO_JH: remove from steps also
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
    customer: Customer,
    queryRunner: QueryRunner,
    session: string,
  ): Promise<void> {
    try {
      const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

      const journeys = await queryRunner.manager.find(Journey, {
        where: {
          workspace: {
            id: workspace.id,
          },
          isActive: true,
          isStopped: false,
          isPaused: false,
          isDynamic: true,
        },
      });
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
  ): Promise<{
    data: EntityWithComputedFields<Journey>[];
    totalPages: number;
  }> {
    try {
      const filterStatusesParts = filterStatusesString.split(',');
      const isActive = filterStatusesParts.includes(JourneyStatus.ACTIVE);
      const isEnrolling = filterStatusesParts.includes(JourneyStatus.ENROLLING);
      const isPaused = filterStatusesParts.includes(JourneyStatus.PAUSED);
      const isStopped = filterStatusesParts.includes(JourneyStatus.STOPPED);
      const isDeleted = filterStatusesParts.includes(JourneyStatus.DELETED);
      const isEditable = filterStatusesParts.includes(JourneyStatus.DRAFT);
      const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

      const whereOrParts: FindOptionsWhere<Journey>[] = [];

      if (isEditable) {
        whereOrParts.push({
          name: Like(`%${search}%`),
          workspace: {
            id: workspace.id,
          },
          isDeleted: false,
          isActive: false,
          isPaused: false,
          isStopped: false,
        });
      }

      const filterStatuses = {
        isActive,
        isEnrolling,
        isPaused,
        isStopped,
        isDeleted,
      };

      if (
        isActive ||
        isPaused ||
        isStopped ||
        isDeleted ||
        isEditable ||
        isEnrolling
      ) {
        for (const [key, value] of Object.entries(filterStatuses)) {
          if (value)
            whereOrParts.push({
              name: Like(`%${search}%`),
              workspace: {
                id: workspace.id,
              },
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
          workspace: {
            id: workspace.id,
          },
          isDeleted: In([!!showDisabled, false]),
        });
      }

      const totalPages = Math.ceil(
        (await this.journeysRepository.count({
          where: whereOrParts,
        })) / take || 1
      );

      let query = this.journeysRepository
        .createQueryBuilder('journey')
        .where(whereOrParts)
        .take(take < 100 ? take : 100)
        .skip(skip)
        .leftJoin('journey.latestChanger', 'account')
        .addSelect('account.email', 'latestChangerEmail');

      if (orderBy)
        query = query.addOrderBy(
          `journey.${orderBy}`,
          orderType == 'desc' ? 'DESC' : 'ASC'
        );

      const journeys = await query.getRawAndEntities();
      const journeyIds = journeys.entities.map((journey) => journey.id);

      const totalCounts = await this.journeyLocationsService.getJourneyListTotalEnrolled(journeyIds);

      const computedFieldsList = ['latestChangerEmail'];

      const result = EntityComputedFieldsHelper.processCollection<Journey>(
        journeys,
        computedFieldsList
      );

      for (const i in result)
        result[i].computed.totalEnrolled = totalCounts[result[i].entity.id];

      return { data: result, totalPages };
    } catch (err) {
      this.error(err, this.findAll.name, session, account.email);
      throw err;
    }
  }

  async getJourneyStatistics(
    account: Account,
    id: string,
    session: string,
    startTime?: Date,
    endTime?: Date,
    frequency?: 'daily' | 'weekly'
  ) {
    const journey = await this.findByID(account, id, session);
    if (!journey) throw new NotFoundException('Journey not found');

    if (!startTime || startTime > endTime) {
      startTime = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
      endTime = new Date();
    } else {
      if (!endTime) endTime = new Date();
    }

    if (!frequency) frequency = 'daily';

    const statistics = await this.journeyStatisticsService.getStatistics(
      journey,
      startTime,
      endTime,
      frequency,
      session
    );

    return statistics;
  }

  async getJourneyCustomers(
    account: Account,
    id: string,
    session: string,
    take = 100,
    skip = 0,
    search?: string,
    sortBy?: string,
    sortType?: string,
    filter?: 'all' | 'in-progress' | 'finished'
  ) {
    const journey = await this.findByID(account, id, session);
    if (!journey) throw new NotFoundException('Journey not found');

    if (take > 100) take = 100;
    if (!search) search = '';
    if (!filter) filter = 'all';

    if (sortBy !== 'status' && sortBy !== 'latestSave') sortBy = 'latestSave';
    if (sortType !== 'desc' && sortType !== 'asc') sortType = 'desc';

    const baseQuery = `
      SELECT * FROM
        (
          SELECT
            "customer" as "customerId",
            "journeyEntry" as "lastUpdate",
            NOT (
                  (step.metadata)::json #>'{destination}' IS NOT NULL 
                  OR EXISTS (
                      SELECT 1 
                      FROM jsonb_array_elements(step.metadata -> 'branches') AS branch 
                      WHERE (branch ->> 'destination') IS NOT NULL
                  )
                  OR (step.metadata -> 'timeBranch' ->> 'destination') IS NOT NULL
                )
            as "isFinished"
          FROM journey_location
          LEFT JOIN step ON step.id = journey_location."stepId"
          WHERE journey_location."journeyId" = $1 AND "customer" LIKE $2
        ) as a
      ${filter === 'all'
        ? ''
        : filter === 'in-progress'
          ? `WHERE a."isFinished" = false`
          : filter === 'finished'
            ? `WHERE a."isFinished" = true`
            : ''
      }
      ORDER BY a.${sortBy === 'status' ? `"isFinished"` : `"lastUpdate"`} ${sortType === 'asc' ? 'ASC' : 'DESC'
      }
    `;

    const countQuery = `SELECT COUNT(*) as count FROM (${baseQuery}) as a`;
    const responseCount =
      await this.journeyLocationsService.journeyLocationsRepository.query(
        countQuery,
        [journey.id, `%${search}%`]
      );

    let count = +responseCount?.[0].count;
    if (isNaN(count)) count = 0;

    const totalPages = Math.ceil(count / take) || 1;

    const paginationQueryPart = `\n
      LIMIT $3
      OFFSET $4`;

    const data =
      await this.journeyLocationsService.journeyLocationsRepository.query(
        ` ${baseQuery}${paginationQueryPart}`,
        [journey.id, `%${search}%`, take, skip]
      );

    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

    const pk = await this.customerKeysService.getPrimaryKey(workspace.id, session);

    if (pk) {
      const customerIds = data.map((item) => item.customerId);

      // const customers = this.CustomerModel.find({
      //   _id: { $in: customerIds },
      // }).cursor();

      // for await (const customer of customers) {
      //   const dataItem = data.find((item) => item.customerId === customer.id);

      //   if (dataItem) dataItem[pk.key] = customer[pk.key];
      // }
    }

    return {
      data: data.map((item) => ({
        customerId: item.customerId,
        [pk.name]: item[pk.name],
        status: item.isFinished ? 'Finished' : 'Enrolled',
        lastUpdate: +item.lastUpdate,
      })),
      totalPages,
    };
  }

  async getJourneyChanges(
    account: Account,
    id: string,
    take = 100,
    skip = 0
  ): Promise<{ activityEvents: ActivityEvent[]; totalPages: number }> {
    if (take > 100) take = 100;

    const journey = await this.findByID(account, id, '');
    if (!journey) throw new NotFoundException('Journey not found');

    const [changes, count] = await this.journeyChangesRepository.findAndCount({
      where: { journey: { id: journey.id } },
      order: {
        createdAt: 'desc',
      },
      take,
      skip,
      relations: ['previousChange', 'changer'],
    });

    const activityEvents = changes.map((change) => ({
      ...this.retrieveJourneyChanges(change),
      changerEmail: change.changer.email,
      date: change.createdAt.toUTCString(),
    }));

    const totalPages = Math.ceil(count / take) || 1;

    return {
      activityEvents,
      totalPages,
    };
  }

  private retrieveJourneyChanges(change2: JourneyChange): {
    type: ActivityEventType;
    changes: Change[];
  } {
    const change1 = change2.previousChange;

    if (!change1)
      return {
        type: ActivityEventType.JOURNEY,
        changes: [
          { type: JourneyChangeType.PUBLISH, name: change2.changedState.name },
        ],
      };

    const state1 = change1.changedState;
    const state2 = change2.changedState;

    const changedKeys: string[] = [];

    for (const key of Object.keys(state1)) {
      if (
        !(typeof state1[key] === 'object' && typeof state2[key] === 'object'
          ? isObjectDeepEqual(state1[key], state2[key])
          : state1[key] === state2[key])
      ) {
        changedKeys.push(key);
      }
    }

    const type = changedKeys.includes('journeySettings')
      ? ActivityEventType.SETTINGS
      : changedKeys.includes('journeyEntrySettings') ||
        changedKeys.includes('inclusionCriteria')
        ? ActivityEventType.ENTRY
        : ActivityEventType.JOURNEY;

    const changes: Change[] = [];

    switch (type) {
      case ActivityEventType.JOURNEY:
        if (!state1.isPaused && state2.isPaused) {
          changes.push({ type: JourneyChangeType.PAUSE });
        }

        if (
          state1.isPaused &&
          !state2.isPaused &&
          state2.isActive &&
          !state2.isStopped &&
          !state2.isDeleted
        ) {
          changes.push({ type: JourneyChangeType.RESUME });
        }

        if (!state1.isStopped && state2.isStopped) {
          changes.push({ type: JourneyChangeType.STOP });
        }

        if (!state1.isDeleted && state2.isDeleted) {
          changes.push({ type: JourneyChangeType.DELETE });
        }
        break;
      case ActivityEventType.ENTRY:
        if (
          !isObjectDeepEqual(state1.inclusionCriteria, state2.inclusionCriteria)
        ) {
          changes.push({
            type: EntryChangeType.ELIGIBLE_USERS,
            inclusionCriteria: state2.inclusionCriteria,
          });
        }

        if (
          !isObjectDeepEqual(
            state1.journeyEntrySettings.entryTiming,
            state2.journeyEntrySettings.entryTiming
          )
        ) {
          changes.push({
            type: EntryChangeType.ENTRY_TIMING,
            entryTiming: state2.journeyEntrySettings.entryTiming,
          });
        }

        if (
          state1.journeyEntrySettings.enrollmentType !==
          state2.journeyEntrySettings.enrollmentType
        ) {
          changes.push({
            type: EntryChangeType.ENTRY_TYPE,
            entryType: state2.journeyEntrySettings.enrollmentType,
          });
        }
        break;
      case ActivityEventType.SETTINGS:
        if (
          !state1.journeySettings.quietHours.enabled &&
          state2.journeySettings.quietHours.enabled
        ) {
          changes.push({
            type: SettingsChangeType.ENABLE_QUIETE_HOURS,
            quietHours: state2.journeySettings.quietHours,
          });
        } else if (
          state1.journeySettings.quietHours.enabled &&
          !state2.journeySettings.quietHours.enabled
        ) {
          changes.push({
            type: SettingsChangeType.DISABLE_QUIETE_HOURS,
          });
        } else if (
          !isObjectDeepEqual(
            state1.journeySettings.quietHours,
            state2.journeySettings.quietHours
          )
        ) {
          changes.push({
            type: SettingsChangeType.CHANGE_QUIETE_HOURS,
            quietHours: state2.journeySettings.quietHours,
          });
        }

        if (
          !state1.journeySettings.maxEntries.enabled &&
          state2.journeySettings.maxEntries.enabled
        ) {
          changes.push({
            type: SettingsChangeType.ENABLE_MAX_USER_ENTRIES,
            maxUserEntries: state2.journeySettings.maxEntries,
          });
        } else if (
          state1.journeySettings.maxEntries.enabled &&
          !state2.journeySettings.maxEntries.enabled
        ) {
          changes.push({
            type: SettingsChangeType.DISABLE_MAX_USER_ENTRIES,
          });
        } else if (
          !isObjectDeepEqual(
            state1.journeySettings.maxEntries,
            state2.journeySettings.maxEntries
          )
        ) {
          changes.push({
            type: SettingsChangeType.CHANGE_MAX_USER_ENTRIES,
            maxUserEntries: state2.journeySettings.maxEntries,
          });
        }

        if (
          !state1.journeySettings.maxMessageSends.enabled &&
          state2.journeySettings.maxMessageSends.enabled
        ) {
          changes.push({
            type: SettingsChangeType.ENABLE_MAX_MESSAGE_SENDS,
            maxMessageSends: state2.journeySettings.maxMessageSends,
          });
        } else if (
          state1.journeySettings.maxMessageSends.enabled &&
          !state2.journeySettings.maxMessageSends.enabled
        ) {
          changes.push({
            type: SettingsChangeType.DISABLE_MAX_MESSAGE_SENDS,
          });
        } else if (
          !isObjectDeepEqual(
            state1.journeySettings.maxMessageSends,
            state2.journeySettings.maxMessageSends
          )
        ) {
          changes.push({
            type: SettingsChangeType.CHANGE_MAX_MESSAGE_SENDS,
            maxMessageSends: state2.journeySettings.maxMessageSends,
          });
        }

        // eslint-disable-next-line no-case-declarations
        const addedTags = state2.journeySettings.tags.filter(
          (tag) => !state1.journeySettings.tags.includes(tag)
        );

        for (const addedTag of addedTags) {
          changes.push({ type: SettingsChangeType.ADD_TAG, tag: addedTag });
        }

        // eslint-disable-next-line no-case-declarations
        const deletedTags = state1.journeySettings.tags.filter(
          (tag) => !state2.journeySettings.tags.includes(tag)
        );

        for (const deletedTag of deletedTags) {
          changes.push({
            type: SettingsChangeType.DELETE_TAG,
            tag: deletedTag,
          });
        }

        break;
      default:
        break;
    }

    return {
      type,
      changes,
    };
  }

  /**
   * Finds all active journeys
   *
   * @param account - The owner of the workflows
   *
   */
  findAllActive(account: Account): Promise<Journey[]> {
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

    return this.journeysRepository.find({
      where: {
        workspace: {
          id: workspace.id,
        },
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
    account = await this.customersService.accountsRepository.findOne({
      where: { id: account.id },
      relations: ['teams.organization.workspaces'],
    });

    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

    if (queryRunner)
      return await queryRunner.manager.findOne(Journey, {
        where: {
          workspace: {
            id: workspace.id,
          },
          id,
        },
      });
    else
      return await this.journeysRepository.findOne({
        where: {
          workspace: {
            id: workspace.id,
          },
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
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

    let found: Journey;
    try {
      found = await this.journeysRepository.findOne({
        where: {
          workspace: {
            id: workspace.id,
          },
          id,
        },
        relations: ['latestChanger'],
      });

      return Promise.resolve({
        name: found.name,
        nodes: found.visualLayout.nodes,
        edges: found.visualLayout.edges,
        segments: found.inclusionCriteria,
        isDynamic: found.isDynamic,
        isActive: found.isActive,
        isEnrolling: found.isEnrolling,
        isPaused: found.isPaused,
        isStopped: found.isStopped,
        isDeleted: found.isDeleted,
        journeyEntrySettings: found.journeyEntrySettings,
        journeySettings: found.journeySettings,
        latestSave: found.latestSave,
        latestChangerEmail: found.latestChanger?.email,
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
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

    try {
      const result = await this.journeysRepository.update(
        {
          workspace: {
            id: workspace.id,
          },
          id: id,
        },
        {
          isActive: false,
          isDeleted: true,
          isPaused: true,
          isStopped: true,
        }
      );
      await this.trackChange(account, id);

      await this.cleanupJourneyCache({ workspaceId: workspace.id });

      return result;
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
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

    try {
      const found: Journey = await this.journeysRepository.findOneBy({
        workspace: {
          id: workspace.id,
        },
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
      const journeyResult = await this.journeysRepository.save({
        ...found,
        isPaused: value,
      });

      await this.trackChange(account, journeyResult.id);

      await this.cleanupJourneyCache({ workspaceId: workspace.id });

      return journeyResult;
    } catch (error) {
      this.error(error, this.setPaused.name, session, account.email);
      throw error;
    }
  }

  /**
   * Start a journey.
   *
   * @param account
   * @param workflowID
   * @param session
   * @returns
   */
  async start(account: Account, journeyID: string, session: string) {
    let journey: Journey;
    let err: any;

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (!account) throw new HttpException('User not found', 404);

      const organization = account.teams?.[0]?.organization;
      const workspace = organization.workspaces?.[0];

      const activeJourneysCount = await queryRunner.manager.countBy(Journey, {
        workspace: {
          id: In(organization.workspaces.map((workspace) => workspace.id)),
        },
        isActive: true,
      });

      if (process.env.NODE_ENV != "development" && organization.plan.activeJourneyLimit != -1) {
        if (activeJourneysCount + 1 > organization.plan.activeJourneyLimit) {
          throw new HttpException(
            'Active journeys limit has been exceeded',
            HttpStatus.PAYMENT_REQUIRED
          );
        }
      }

      const accountWithConnections = await queryRunner.manager.findOne(
        Account,
        {
          where: { id: account.id },
          relations: [
            'teams.organization.workspaces',
            'teams.organization.workspaces.mailgunConnections.sendingOptions',
            'teams.organization.workspaces.sendgridConnections.sendingOptions',
            'teams.organization.workspaces.resendConnections.sendingOptions',
            'teams.organization.workspaces.twilioConnections',
            'teams.organization.workspaces.pushConnections',
          ],
        }
      );

      await this.cleanupJourneyCache({ workspaceId: workspace.id });

      journey = await queryRunner.manager.findOne(Journey, {
        where: {
          workspace: {
            id: workspace.id,
          },
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

      const graph = new Graph();
      const steps = await this.stepsService.transactionalfindByJourneyID(
        account,
        journey.id,
        queryRunner
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

      let jobs = [];
      const multiSplitSteps: Step[] =
        await this.stepsService.transactionalfindAllByTypeInJourney(
          account,
          StepType.MULTISPLIT,
          journey.id,
          queryRunner,
          session
        );
      if (multiSplitSteps.length) {
        for (
          let stepIndex = 0;
          stepIndex < multiSplitSteps.length;
          stepIndex++
        ) {
          for (
            let branchIndex = 0;
            branchIndex < multiSplitSteps[stepIndex].metadata.branches.length;
            branchIndex++
          ) {
            const segment = await queryRunner.manager.save(Segment, {
              type: SegmentType.SYSTEM,
              name: '__SYSTEM__',
              inclusionCriteria:
                multiSplitSteps[stepIndex].metadata.branches[branchIndex]
                  .conditions,
              workspace: {
                id: account.teams?.[0]?.organization.workspaces?.[0].id,
              },
              isUpdating: false,
            });
            multiSplitSteps[stepIndex].metadata.branches[
              branchIndex
            ].systemSegment = segment.id;

            await queryRunner.manager.save(Step, multiSplitSteps[stepIndex]);

            jobs.push({
              name: 'createSystem',
              data: {
                account,
                journey,
                session,
                segment,
              },
            });
          }
        }
      }

      if (
        journey.journeyEntrySettings.entryTiming.type ===
        EntryTiming.WhenPublished
      ) {
        journey = await queryRunner.manager.save(Journey, {
          ...journey,
          enrollment_count: journey.enrollment_count + 1,
          last_enrollment_timestamp: Date.now(),
          isActive: true,
          isEnrolling: true,
          startedAt: new Date(Date.now()),
          totalSystemSegments: jobs.length,
        });
      } else {
        journey = await queryRunner.manager.save(Journey, {
          ...journey,
          isEnrolling: true,
          isActive: true,
          startedAt: new Date(Date.now()),
          totalSystemSegments: jobs.length,
        });
      }

      await this.trackChange(account, journeyID, queryRunner);
      await queryRunner.commitTransaction();
      if (jobs.length)
        await Producer.addBulk(QueueType.SEGMENT_UPDATE,
          jobs.map((job) => {
            return {
              ...job.data,
              journey,
            };
          }), 'createSystem');
      else
        await Producer.add(QueueType.ENROLLMENT, {
          account,
          journey,
          session,
        });
    } catch (e) {
      err = e;
      this.error(e, this.start.name, session, account.email);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
      if (err) throw err;
    }
  }

  /**
   * Stops a journey.
   * @param account
   * @param id
   * @param session
   * @returns
   */
  async stop(account: Account, id: string, session: string) {
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

    try {
      const found: Journey = await this.journeysRepository.findOneBy({
        workspace: {
          id: workspace.id,
        },
        id,
      });
      if (!found?.isActive)
        throw new HttpException('The workflow was not activated', 400);
      const journeyResult = await this.journeysRepository.save({
        ...found,
        isStopped: true,
        isActive: false,
        isPaused: true,
      });

      await this.trackChange(account, journeyResult.id);

      await this.cleanupJourneyCache({ workspaceId: workspace.id });
    } catch (err) {
      this.error(err, this.stop.name, session, account.email);
      throw err;
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

      const { visualLayout, isDynamic, name, inclusionCriteria } =
        updateJourneyDto;

      return await queryRunner.manager.save(Journey, {
        ...journey,
        visualLayout,
        isDynamic,
        name,
        inclusionCriteria,
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
      if (journey.isDeleted || journey.isStopped)
        throw new Error('Journey is no longer editable.');

      const {
        isDynamic,
        name,
        inclusionCriteria,
        journeyEntrySettings,
        journeySettings,
        changeSegmentOption,
      } = updateJourneyDto;

      if (
        JSON.stringify(journey.inclusionCriteria) !==
        JSON.stringify(inclusionCriteria) &&
        (journey.isActive || journey.isPaused)
      ) {
        // TODO: add logic of eligable users update on parameters change (using changeSegmentOption)
      }

      const journeyResult = await this.journeysRepository.save({
        ...journey,
        isDynamic,
        name,
        inclusionCriteria,
        journeyEntrySettings,
        journeySettings,
        latestSave: new Date(),
        latestChanger: { id: account.id },
      });

      if (
        [journey.isActive, journey.isPaused, journey.isStopped].some(
          (bool) => bool
        )
      ) {
        await this.trackChange(account, journey.id);
      }

      return journeyResult;
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
    session: string,
    runner?: QueryRunner
  ): Promise<Journey> {
    let queryRunner: QueryRunner;
    runner ? queryRunner = runner : queryRunner = this.dataSource.createQueryRunner();
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

            metadata.connectionId = nodes[i].data.connectionId;
            metadata.sendingOptionId = nodes[i].data.sendingOptionId;

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
          case NodeType.PUSH:
            if (relevantEdges.length > 1)
              throw new Error(
                'Cannot have more than one branch for Message Step'
              );
            metadata = new MessageStepMetadata();
            metadata.destination = nodes.filter((node) => {
              return node.id === relevantEdges[0].target;
            })[0].data.stepId;
            metadata.channel = Channel.PUSH;
            metadata.customName = nodes[i].data['customName'] || 'Unknown name';
            if (nodes[i].data['template']['selected']) {
              metadata.template = nodes[i].data['template']['selected']['id'];
              if (nodes[i].data['template']['selected']['pushBuilder'])
                metadata.selectedPlatform =
                  nodes[i].data['template']['selected']['pushBuilder'][
                  'selectedPlatform'
                  ];
            }
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
                  if (relevantEdges[i].data['branch'].conditions[eventsIndex].type === "analytics") {
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
                  } else {
                    const event = new MessageEvent();
                    event.providerType =
                      relevantEdges[i].data['branch'].conditions[eventsIndex][
                      'providerType'
                      ];
                    event.journey =
                      relevantEdges[i].data['branch'].conditions[eventsIndex][
                      'from'
                      ]['key'];
                    event.step =
                      relevantEdges[i].data['branch'].conditions[eventsIndex][
                      'fromSpecificMessage'
                      ]['key'];
                    event.eventCondition =
                      relevantEdges[i].data['branch'].conditions[eventsIndex][
                      'eventCondition'
                      ];
                    // event.happenCondition =
                    //   relevantEdges[i].data['branch'].conditions[eventsIndex][
                    //     'happenCondition'
                    //   ];
                    branch.events.push(event);
                  }
                }
                metadata.branches.push(branch);
              }
              else if (
                relevantEdges[i].data['branch'].type === BranchType.WU_ATTRIBUTE
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
                  const event = new AttributeChangeEvent();
                  event.attributeName =
                    relevantEdges[i].data['branch'].conditions[eventsIndex][
                      'attributeName'
                    ].split(';;')[0];
                  event.happenCondition =
                    relevantEdges[i].data['branch'].conditions[eventsIndex][
                    'happenCondition'
                    ];
                  if (event.happenCondition === 'changed to') {
                    event.value =
                      relevantEdges[i].data['branch'].conditions[eventsIndex][
                      'value'
                      ];
                    event.valueType =
                      relevantEdges[i].data['branch'].conditions[eventsIndex][
                      'valueType'
                      ];
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
          case NodeType.EXPERIMENT:
            metadata = new ExperimentMetadata();
            metadata.branches = [];

            for (let j = 0; j < relevantEdges.length; j++) {
              const edge = relevantEdges[j];

              const branch = new ExperimentBranch();

              branch.index = j;
              branch.ratio = nodes[i].data.branches[j]?.ratio || 0;

              const edgeTarget = nodes.find((node) => node.id === edge.target);
              branch.destination = edgeTarget.data.stepId;

              metadata.branches.push(branch);
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
        latestSave: new Date(),
        latestChanger: { id: account.id },
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
      if (!runner) await queryRunner.rollbackTransaction();
    } finally {
      if (!runner) await queryRunner.release();
      if (err) throw err;
    }
  }
  async getAllJourneyTags(account: Account, session: string): Promise<any> {
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

    try {
      const tags = await this.dataSource.query(
        `
      SELECT DISTINCT json_array_elements_text("journeySettings"::json->'tags') as tag
      FROM journey
      WHERE "journeySettings" is not null and "workspaceId" = $1
      `,
        [workspace.id]
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
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

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
          AND "workspaceId" = $3
  `,
        [type, id, workspace.id]
      );

      return data;
    } catch (err) {
      this.error(err, this.findAllMessages.name, session, account.email);
      throw err;
    }
  }

  /**
   * Checks if limit for unique customers on the given journey has been reached.
   *
   * @returns boolean
   *    true if rate limit reached (aka new customer can not be added)
   *    false if rate limit not yet reached (aka new customer can be added)
   */
  async rateLimitEntryByUniqueEnrolledCustomers(
    owner: Account,
    journey: Journey,
    queryRunner?: QueryRunner
  ) {
    const maxEntriesSettings = journey?.journeySettings?.maxEntries;
    if (maxEntriesSettings && maxEntriesSettings.enabled) {
      const maxEnrollment = parseInt(maxEntriesSettings.maxEntries);
      const currentEnrollment =
        await this.journeyLocationsService.getNumberOfEnrolledCustomers(
          owner,
          journey,
          queryRunner
        );

      if (currentEnrollment >= maxEnrollment) {
        return true;
      }
    }
    return false;
  }

  /**
   * Reads the settings of a journey and returns an array with two keys
   * @returns [boolean, number | undefined] where:
   *    first item: whether rate limit of unique customers able to receive messsages is enabled
   *    second item: max number of unique customers able to receive messages, if enabled
   */
  rateLimitByCustomersMessagedEnabled(
    journey: Journey
  ): readonly [boolean, number | undefined] {
    const maxMessageSends = journey?.journeySettings?.maxMessageSends;
    if (maxMessageSends.enabled && maxMessageSends.maxUsersReceive != null) {
      const customerLimit = parseInt(maxMessageSends.maxUsersReceive);
      return [true, customerLimit] as const;
    }
    return [false, undefined] as const;
  }

  /** */
  async rateLimitByCustomersMessaged(
    owner: Account,
    journey: Journey,
    session: string,
    queryRunner?: QueryRunner
  ) {
    const [enabled, customerLimit] =
      this.rateLimitByCustomersMessagedEnabled(journey);
    if (enabled) {
      const currentUniqueCustomers =
        await this.journeyLocationsService.getNumberOfUniqueCustomersMessaged(
          owner,
          journey,
          queryRunner
        );
      if (currentUniqueCustomers >= customerLimit) {
        this.log(
          `Unique customers messaged limit hit. journey: ${journey.id} limit:${customerLimit} currentUniqueCustomers: ${currentUniqueCustomers}`,
          this.rateLimitByCustomersMessaged.name,
          session,
          owner.id
        );
        return true;
      }
    }
    return false;
  }

  /**
   * Reads the settings of a journey and returns an array with two keys
   * @returns [boolean, number | undefined] where:
   *    first item: whether rate limit messsage sends per minute is enabled
   *    second item: max number of message sends per minute, if enabled
   */
  rateLimitByMinuteEnabled(
    journey: Journey
  ): readonly [boolean, number | undefined] {
    const maxMessageSends = journey?.journeySettings?.maxMessageSends;
    if (maxMessageSends.enabled && maxMessageSends.maxSendRate != null) {
      const rateLimit = parseInt(maxMessageSends.maxSendRate);
      return [true, rateLimit] as const;
    }
    return [false, undefined] as const;
  }

  async rateLimitByMinute(owner: Account, journey: Journey) {
    const [enabled, rateLimit] = this.rateLimitByMinuteEnabled(journey);
    if (enabled) {
      const now = new Date();
      const currValue = parseInt(
        await this.redisService
          .getClient()
          .get(`${owner.id}:${journey.id}:${now.getUTCMinutes()}`)
      );
      if (!isNaN(currValue) && currValue >= rateLimit) {
        return true;
      }
    }
    return false;
  }

  async rateLimitByMinuteIncrement(owner: Account, journey: Journey) {
    const now = new Date();
    const rateLimitKey = `${owner.id}:${journey.id}:${now.getUTCMinutes()}`;
    await this.redisService
      .getClient()
      .multi()
      .incr(rateLimitKey)
      .expire(rateLimitKey, 59)
      .exec();
  }

  public async trackChange(
    changer: Account,
    journeyId: string,
    queryRunner?: QueryRunner
  ) {
    const journey = queryRunner
      ? await queryRunner.manager.findOneBy(Journey, { id: journeyId })
      : await this.findByID(changer, journeyId, '');
    if (!journey) throw new NotFoundException('Journey not found');

    const previousChange = await this.journeyChangesRepository.findOne({
      where: {
        journey: { id: journey.id },
      },
      order: {
        createdAt: 'desc',
      },
    });

    delete journey.visualLayout;
    delete journey.latestSave;
    delete journey.latestChanger;
    delete journey.createdAt;
    delete journey.latestPause;
    delete journey.workspace;

    await this.journeyChangesRepository.save({
      journey: { id: journey.id },
      changer: { id: changer.id },
      changedState: journey,
      previousChange: previousChange ? { id: previousChange.id } : undefined,
    });
  }

  async cleanupJourneyCache(data: { workspaceId: string }) {
    // invalidate journeys cache entry set in eventPreprocessor
    if (data.workspaceId) {
      await this.cacheService.delete(CacheConstants.JOURNEYS, data.workspaceId);
    }
  }
}
