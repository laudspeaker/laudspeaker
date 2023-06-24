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
import { AudiencesService } from '../audiences/audiences.service';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import {
  EventConditionElementsFilter,
  FilterByOption,
  PosthogTriggerParams,
  ProviderTypes,
  Trigger,
  TriggerType,
  Workflow,
} from './entities/workflow.entity';
import errors from '../../shared/utils/errors';
import { Audience } from '../audiences/entities/audience.entity';
import { CustomersService } from '../customers/customers.service';
import {
  Customer,
  CustomerDocument,
} from '../customers/schemas/customer.schema';
import { EventDto } from '../events/dto/event.dto';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { createClient } from '@clickhouse/client';
import { WorkflowTick } from './interfaces/workflow-tick.interface';
import { isBoolean, isString, isUUID } from 'class-validator';
import {
  EventKeys,
  EventKeysDocument,
} from '../events/schemas/event-keys.schema';
import mongoose, { ClientSession, Model } from 'mongoose';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { AudiencesHelper } from '../audiences/audiences.helper';
import { Template } from '../templates/entities/template.entity';
import { BadRequestException } from '@nestjs/common/exceptions';
import { Job, TimeJobType } from '../jobs/entities/job.entity';
import { Filter } from '../filter/entities/filter.entity';

export enum JourneyStatus {
  ACTIVE = 'Active',
  PAUSED = 'Paused',
  STOPPED = 'Stopped',
  DELETED = 'Deleted',
  EDITABLE = 'Editable',
}

@Injectable()
export class WorkflowsService {
  private clickhouseClient = createClient({
    host: process.env.CLICKHOUSE_HOST
      ? process.env.CLICKHOUSE_HOST.includes('http')
        ? process.env.CLICKHOUSE_HOST
        : `http://${process.env.CLICKHOUSE_HOST}`
      : 'http://localhost:8123',
    username: process.env.CLICKHOUSE_USER ?? 'default',
    password: process.env.CLICKHOUSE_PASSWORD ?? '',
  });

  constructor(
    private dataSource: DataSource,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @InjectRepository(Workflow)
    public workflowsRepository: Repository<Workflow>,
    @Inject(AudiencesService) private audiencesService: AudiencesService,
    @InjectModel(Customer.name) public CustomerModel: Model<CustomerDocument>,
    @Inject(forwardRef(() => CustomersService))
    private customersService: CustomersService,
    @InjectModel(EventKeys.name)
    private EventKeysModel: Model<EventKeysDocument>,
    @InjectConnection() private readonly connection: mongoose.Connection,
    private readonly audiencesHelper: AudiencesHelper
  ) {}

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: WorkflowsService.name,
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
        class: WorkflowsService.name,
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
        class: WorkflowsService.name,
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
        class: WorkflowsService.name,
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
        class: WorkflowsService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  /**
   * Finds all workflows
   *
   * @param account - The owner of the workflows
   *
   */
  async findAll(
    account: Account,
    session: string,
    take = 100,
    skip = 0,
    orderBy?: keyof Workflow,
    orderType?: 'asc' | 'desc',
    showDisabled?: boolean,
    search = '',
    filterStatusesString = ''
  ): Promise<{ data: Workflow[]; totalPages: number }> {
    try {
      const filterStatusesParts = filterStatusesString.split(',');
      const isActive = filterStatusesParts.includes(JourneyStatus.ACTIVE);
      const isPaused = filterStatusesParts.includes(JourneyStatus.PAUSED);
      const isStopped = filterStatusesParts.includes(JourneyStatus.STOPPED);
      const isDeleted = filterStatusesParts.includes(JourneyStatus.DELETED);
      const isEditable = filterStatusesParts.includes(JourneyStatus.EDITABLE);

      const whereOrParts: FindOptionsWhere<Workflow>[] = [];

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
        (await this.workflowsRepository.count({
          where: whereOrParts,
        })) / take || 1
      );
      const orderOptions = {};
      if (orderBy && orderType) {
        orderOptions[orderBy] = orderType;
      }
      const workflows = await this.workflowsRepository.find({
        where: whereOrParts,
        order: orderOptions,
        take: take < 100 ? take : 100,
        skip,
      });
      return { data: workflows, totalPages };
    } catch (err) {
      this.logger.error(
        `workflows.service.ts:WorkflowsService.findAll: Error: ${err}`
      );
      return Promise.reject(err);
    }
  }

  /**
   * Finds all active workflows
   *
   * @param account - The owner of the workflows
   *
   */
  findAllActive(account: Account): Promise<Workflow[]> {
    return this.workflowsRepository.find({
      where: {
        owner: { id: account.id },
        isActive: true,
        isStopped: false,
        isPaused: false,
      },
      relations: ['filter'],
    });
  }

  private async getStats(audienceId?: string) {
    if (!audienceId) return {};
    const sentResponse = await this.clickhouseClient.query({
      query: `SELECT COUNT(*) FROM message_status WHERE event = 'sent' AND audienceId = {audienceId:UUID}`,
      query_params: { audienceId },
    });
    const sentData = (await sentResponse.json<any>())?.data;
    const sent = +sentData?.[0]?.['count()'] || 0;

    const deliveredResponse = await this.clickhouseClient.query({
      query: `SELECT COUNT(*) FROM message_status WHERE event = 'delivered' AND audienceId = {audienceId:UUID}`,
      query_params: { audienceId },
    });
    const deliveredData = (await deliveredResponse.json<any>())?.data;
    const delivered = +deliveredData?.[0]?.['count()'] || 0;

    const openedResponse = await this.clickhouseClient.query({
      query: `SELECT COUNT(DISTINCT(audienceId, customerId, templateId, messageId, event, eventProvider)) FROM message_status WHERE event = 'opened' AND audienceId = {audienceId:UUID}`,
      query_params: { audienceId },
    });
    const openedData = (await openedResponse.json<any>())?.data;
    const opened =
      +openedData?.[0]?.[
        'uniqExact(tuple(audienceId, customerId, templateId, messageId, event, eventProvider))'
      ];

    const openedPercentage = (opened / sent) * 100;

    const clickedResponse = await this.clickhouseClient.query({
      query: `SELECT COUNT(DISTINCT(audienceId, customerId, templateId, messageId, event, eventProvider)) FROM message_status WHERE event = 'clicked' AND audienceId = {audienceId:UUID}`,
      query_params: { audienceId },
    });
    const clickedData = (await clickedResponse.json<any>())?.data;
    const clicked =
      +clickedData?.[0]?.[
        'uniqExact(tuple(audienceId, customerId, templateId, messageId, event, eventProvider))'
      ];

    const clickedPercentage = (clicked / sent) * 100;

    const whResponse = await this.clickhouseClient.query({
      query: `SELECT COUNT(*) FROM message_status WHERE event = 'sent' AND audienceId = {audienceId:UUID} AND eventProvider = 'webhooks' `,
      query_params: {
        audienceId,
      },
    });
    const wsData = (await whResponse.json<any>())?.data;
    const wssent = +wsData?.[0]?.['count()'] || 0;

    return {
      sent,
      delivered,
      openedPercentage,
      clickedPercentage,
      wssent,
    };
  }

  /**
   * Finds a workflow by name, creating it if it does not
   * exist.
   *
   * @remarks
   * Throws an error if the workflow is not found
   *
   * @param account - The owner of the workflow
   * @param name - name of workflow to find/create
   *
   */
  async findOne(
    account: Account,
    id: string,
    needStats: boolean,
    session: string
  ): Promise<Workflow> {
    if (!isUUID(id)) throw new BadRequestException('Id is not valid uuid');

    let found: Workflow;
    try {
      found = await this.workflowsRepository.findOne({
        where: {
          owner: { id: account.id },
          id,
        },
        relations: ['filter'],
      });
    } catch (err) {
      this.logger.error(
        `workflows.service.ts:WorkflowsService.findOne: Error: ${err}`
      );
      return Promise.reject(err);
    }

    try {
      if (needStats && found?.visualLayout) {
        found.visualLayout.nodes = await Promise.all(
          found?.visualLayout?.nodes?.map(async (node) => ({
            ...node,
            data: {
              ...node.data,
              stats: await this.getStats(node?.data?.audienceId),
            },
          }))
        );
      }
    } catch (e: any) {
      this.logger.error(
        `workflows.service.ts:WorkflowsService.findOne: Error: ${e}`
      );
    }

    this.logger.debug('Found workflow: ' + found?.id);
    return found;
  }

  async create(account: Account, name: string, session: string) {
    let ret: Workflow;
    try {
      ret = await this.workflowsRepository.save({
        name,
        audiences: [],
        owner: { id: account.id },
      });
      this.logger.debug('Created workflow: ' + ret?.id);
    } catch (err) {
      this.logger.error(
        `workflows.service.ts:WorkflowsService.findOne: Error: ${err}`
      );
      return Promise.reject(err);
    }
    return Promise.resolve(ret); //await this.workflowsRepository.save(workflow)
  }

  /**
   * Updates the audiences, name, visual layout, and rules of a workflow
   *
   * @remarks
   * Throws an error if the workflow is not found
   *
   * @param account - The owner of the workflow
   * @param updateWorkflowDto - fields to update
   *
   */
  async update(
    account: Account,
    updateWorkflowDto: UpdateWorkflowDto,
    session: string,
    queryRunner = this.dataSource.createQueryRunner()
  ): Promise<void> {
    const alreadyInsideTransaction = queryRunner.isTransactionActive;
    if (!alreadyInsideTransaction) {
      await queryRunner.connect();
      await queryRunner.startTransaction();
    }

    try {
      const workflow = await queryRunner.manager.findOne(Workflow, {
        where: {
          id: updateWorkflowDto.id,
        },
        relations: ['filter'],
      });

      if (!workflow) throw new NotFoundException('Workflow not found');
      if (workflow.isActive)
        return Promise.reject(new Error('Workflow has already been activated'));

      const { rules, visualLayout, isDynamic, audiences, name } =
        updateWorkflowDto;
      if (rules) {
        const newRules: string[] = [];
        for (const trigger of rules) {
          for (const condition of trigger.properties.conditions) {
            const { key, type, isArray } = condition;
            if (isString(key) && isString(type) && isBoolean(isArray)) {
              const eventKey = await this.EventKeysModel.findOne({
                key,
                type,
                isArray,
                ownerId: account.id,
                providerSpecific: trigger.providerType,
              }).exec();
              const defaultKey = await this.EventKeysModel.findOne({
                key,
                type,
                isDefault: true,
                providerSpecific: trigger.providerType,
              }).exec();
              if (!eventKey && !defaultKey)
                await this.EventKeysModel.create({
                  key,
                  type,
                  isArray,
                  ownerId: account.id,
                  providerSpecific: trigger.providerType,
                });
            }
          }
          newRules.push(
            Buffer.from(JSON.stringify(trigger)).toString('base64')
          );
        }
        workflow.rules = newRules;
      }

      if (visualLayout) {
        for (const node of visualLayout.nodes) {
          const audienceId = node?.data?.audienceId;
          const nodeTemplates = node?.data?.messages;
          if (!nodeTemplates || !Array.isArray(nodeTemplates) || !audienceId)
            continue;

          const templates = (
            await Promise.all(
              nodeTemplates.map((item) =>
                queryRunner.manager.findOneBy(Template, {
                  id: item.templateId,
                })
              )
            )
          ).filter((item) => item.id);

          await queryRunner.manager.save(Audience, {
            id: audienceId,
            owner: { id: account.id },
            templates,
          });
        }
      }

      let filterId = workflow.filter?.id;
      if (updateWorkflowDto.filterId !== undefined) {
        filterId = updateWorkflowDto.filterId;
      }

      await queryRunner.manager.save(Workflow, {
        ...workflow,
        filter: { id: filterId },
        audiences,
        visualLayout,
        isDynamic,
        name,
      });
      this.logger.debug('Updated workflow ' + updateWorkflowDto.id);

      if (!alreadyInsideTransaction) await queryRunner.commitTransaction();
    } catch (e) {
      this.logger.error(
        `workflows.service.ts:WorkflowsService.update: Error: ${e}`
      );
      if (!alreadyInsideTransaction) await queryRunner.rollbackTransaction();
    } finally {
      if (!alreadyInsideTransaction) await queryRunner.release();
    }
  }

  async duplicate(user: Account, id: string, session: string) {
    const oldWorkflow = await this.workflowsRepository.findOne({
      where: {
        owner: { id: user.id },
        id,
      },
      relations: ['filter'],
    });
    if (!oldWorkflow) throw new NotFoundException('Workflow not found');

    let copyEraseIndex = oldWorkflow.name.indexOf('-copy');
    if (copyEraseIndex === -1) copyEraseIndex = oldWorkflow.name.length;

    const res = await this.workflowsRepository
      .createQueryBuilder()
      .select('COUNT(*)')
      .where('starts_with(name, :oldName) = TRUE AND "ownerId" = :ownerId', {
        oldName: oldWorkflow.name.substring(0, copyEraseIndex),
        ownerId: user.id,
      })
      .execute();
    const newName =
      oldWorkflow.name.substring(0, copyEraseIndex) +
      '-copy-' +
      (res?.[0]?.count || '0');
    const newWorkflow = await this.create(user, newName, session);

    const oldAudiences = await this.audiencesService.audiencesRepository.find({
      where: { workflow: { id: oldWorkflow.id } },
      relations: ['workflow', 'owner'],
    });

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const newAudiences: Audience[] = await queryRunner.manager.save(
        Audience,
        oldAudiences.map((oldAudience) => ({
          customers: [],
          name: oldAudience.name,
          isPrimary: oldAudience.isPrimary,
          description: oldAudience.description,
          owner: oldAudience.owner,
          workflow: newWorkflow,
        }))
      );

      let visualLayout = JSON.stringify(oldWorkflow.visualLayout);
      const rules = oldWorkflow.rules?.map((rule) =>
        Buffer.from(rule, 'base64').toString()
      );

      if (rules) {
        for (let i = 0; i < oldAudiences.length; i++) {
          const oldAudienceId = oldAudiences[i].id;
          const newAudienceId = newAudiences[i].id;
          visualLayout = visualLayout.replaceAll(oldAudienceId, newAudienceId);
          for (let i = 0; i < rules.length; i++) {
            rules[i] = rules[i].replaceAll(oldAudienceId, newAudienceId);
          }
        }
      }

      visualLayout = JSON.parse(visualLayout);
      const triggers: Trigger[] = rules?.map((rule) => JSON.parse(rule));

      await this.update(
        user,
        {
          id: newWorkflow.id,
          name: newName,
          visualLayout,
          rules: triggers,
          filterId: oldWorkflow.filter?.id,
          isDynamic: oldWorkflow.isDynamic,
        },
        session,
        queryRunner
      );

      await queryRunner.commitTransaction();
    } catch (e) {
      this.logger.error(
        `workflows.service.ts:WorkflowsService.duplicate: Error: ${e}`
      );
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Start a workflow, adding the initial set of customers to the primary audience
   * and sending them any relevant messages. Similar to enrollCustomers,
   * many customers -> one workflow
   *
   * @remarks
   * Throws an error if the workflow is not found
   *
   * @param account - The owner of the workflow
   * @param updateAudienceDto - DTO with the updated information
   *
   */
  async start(
    account: Account,
    workflowID: string,
    session: string
  ): Promise<(string | number)[]> {
    let workflow: Workflow; // Workflow to update
    let customers: CustomerDocument[]; // Customers to add to primary audience
    let jobIDs: (string | number)[] = [];

    const transactionSession = await this.connection.startSession();
    await transactionSession.startTransaction();
    const queryRunner = await this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      if (!account) throw new HttpException('User not found', 404);

      workflow = await queryRunner.manager.findOne(Workflow, {
        where: {
          owner: { id: account?.id },
          id: workflowID,
        },
        relations: ['filter'],
      });
      if (!workflow) {
        this.logger.debug('Workflow does not exist');
        return Promise.reject(errors.ERROR_DOES_NOT_EXIST);
      }

      if (workflow.isActive) {
        this.logger.debug('Workflow already active');
        return Promise.reject(new Error('Workflow already active'));
      }
      if (workflow?.isStopped)
        return Promise.reject(
          new Error('The workflow has already been stopped')
        );
      if (!workflow?.filter)
        return Promise.reject(
          new Error('To start workflow filter should be defined')
        );

      const audiences = await queryRunner.manager.findBy(Audience, {
        workflow: { id: workflow.id },
      });

      for (let audience of audiences) {
        audience = await this.audiencesService.freeze(
          account,
          audience.id,
          queryRunner,
          session
        );
        this.logger.debug('Freezing audience ' + audience?.id);

        if (audience.isPrimary) {
          customers = await this.customersService.findByInclusionCriteria(
            account,
            workflow.filter.inclusionCriteria,
            transactionSession,
            session
          );

          const unenrolledCustomers = customers.filter(
            (customer) => customer.workflows.indexOf(workflowID) < 0
          );
          await this.CustomerModel.updateMany(
            {
              _id: { $in: unenrolledCustomers.map((customer) => customer.id) },
            },
            { $addToSet: { workflows: workflowID } }
          )
            .session(transactionSession)
            .exec();

          this.logger.debug(
            'Customers to include in workflow: ' + customers.length
          );

          jobIDs = await this.audiencesService.moveCustomers(
            account,
            null,
            audience,
            unenrolledCustomers,
            null,
            queryRunner,
            workflow.rules,
            workflow.id,
            session
          );
          this.logger.debug('Finished moving customers into workflow');

          await queryRunner.manager.save(Workflow, {
            ...workflow,
            isActive: true,
            startedAt: new Date(Date.now()),
          });
          this.logger.debug('Started workflow ' + workflow?.id);
        }
      }

      const filter = await queryRunner.manager.findOneBy(Filter, {
        id: workflow.filter.id,
      });
      await queryRunner.manager.save(Filter, { ...filter, isFreezed: true });

      await transactionSession.commitTransaction();
      await queryRunner.commitTransaction();
    } catch (err) {
      await transactionSession.abortTransaction();
      await queryRunner.rollbackTransaction();
      this.logger.error('Error: ' + err);
      throw err;
    } finally {
      await transactionSession.endSession();
      await queryRunner.release();
    }

    return Promise.resolve(jobIDs);
  }

  /**
   * Adds a customer to dynamic primary audience of all active workflows,
   * and sends them any relevant messages. Similar to  start,
   * one customer -> many workflows
   *
   * @remarks Throws an error if the workflow is not found
   * @param account The owner of the workflow
   * @param updateAudienceDto DTO with the updated information
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
      this.debug(
        `Finding active workflows...`,
        this.enrollCustomer.name,
        session,
        account.id
      );

      const workflows = await queryRunner.manager.find(Workflow, {
        where: {
          owner: { id: account.id },
          isActive: true,
          isStopped: false,
          isPaused: false,
        },
        relations: ['filter'],
      });
      this.debug(
        `Number of active workflows ${JSON.stringify({
          length: workflows?.length,
        })}`,
        this.enrollCustomer.name,
        session,
        account.id
      );

      for (
        let workflowsIndex = 0;
        workflowsIndex < workflows?.length;
        workflowsIndex++
      ) {
        const workflow = workflows[workflowsIndex];
        const audiences = await queryRunner.manager.findBy(Audience, {
          workflow: { id: workflow.id },
        });
        for (const audience of audiences) {
          this.logger.debug('Audience: ' + audience);
          if (
            audience.isPrimary &&
            workflow.isDynamic &&
            (await this.customersService.checkInclusion(
              customer,
              workflow.filter.inclusionCriteria,
              session,
              account
            )) &&
            customer.workflows.indexOf(workflow.id) < 0
          ) {
            await this.audiencesService.moveCustomer(
              account,
              null,
              audience?.id,
              customer,
              null,
              queryRunner,
              workflow.rules,
              workflow.id,
              session
            );
            const updateResult = await this.CustomerModel.updateOne(
              { _id: customer._id },
              { $addToSet: { workflows: workflow.id } }
            )
              .session(clientSession)
              .exec();
            this.debug(
              `Customer enrolled: ${JSON.stringify(updateResult)}`,
              this.enrollCustomer.name,
              session,
              account.id
            );
          }
        }
      }
    } catch (err) {
      this.error(err, this.enrollCustomer.name, session, account.id);
      return Promise.reject(err);
    }
  }

  /**
   * Update an account's active workflows based on event and time
   * based triggers, moving all customers to the correct
   * audiences and sending all the messages.
   *
   * @remarks
   * TODO: Error handling
   * TODO: Branch triggers
   * TODO: Time triggers
   *
   * @param account - The owner of the workflow
   * @param event - incoming event to use as basis for tick
   *
   */
  async tick(
    account: Account,
    event: EventDto | null | undefined,
    queryRunner: QueryRunner,
    transactionSession: ClientSession,
    session: string
  ): Promise<WorkflowTick[]> {
    let workflows: Workflow[], // Active workflows for this account
      workflow: Workflow, // Workflow being updated
      customer: CustomerDocument, // Customer to be found
      trigger: Trigger, // Trigger being processed
      from: Audience, //  Audience to move customer out of
      to: Audience; // Audience to move customer into
    const jobIds: WorkflowTick[] = [];
    let interrupt = false; // Interrupt the tick to avoid the same event triggering two customer moves

    try {
      if (event) {
        customer = await this.customersService.findByCorrelationKVPair(
          account,
          event.correlationKey,
          event.correlationValue,
          transactionSession
        );
        this.debug(
          `Found customer: ${JSON.stringify(customer)}`,
          this.tick.name,
          session,
          account.id
        );
      }
      workflows = await queryRunner.manager.find(Workflow, {
        where: {
          owner: { id: account.id },
          isActive: true,
          isStopped: false,
          isPaused: false,
        },
        relations: ['filter'],
      });
      this.debug(
        `Number of active workflows: ${JSON.stringify({
          length: workflows?.length,
        })}`,
        this.tick.name,
        session,
        account.id
      );

      workflow_loop: for (
        let workflowsIndex = 0;
        workflowsIndex < workflows?.length;
        workflowsIndex++
      ) {
        workflow = workflows[workflowsIndex];
        const jobId: WorkflowTick = {
          workflowId: workflow.id,
          jobIds: undefined,
          status: undefined,
          failureReason: undefined,
        };

        interrupt = false;
        for (
          let triggerIndex = 0;
          triggerIndex < workflow?.rules?.length;
          triggerIndex++
        ) {
          if (interrupt) {
            break;
          }
          trigger = JSON.parse(
            Buffer.from(workflow.rules[triggerIndex], 'base64').toString(
              'ascii'
            )
          );

          if (
            event.source === ProviderTypes.Posthog &&
            trigger.providerType === ProviderTypes.Posthog &&
            !(
              (event.payload.type === PosthogTriggerParams.Track &&
                event.payload.event === 'change' &&
                trigger.providerParams === PosthogTriggerParams.Typed) ||
              (event.payload.type === PosthogTriggerParams.Track &&
                event.payload.event === 'click' &&
                trigger.providerParams === PosthogTriggerParams.Autocapture) ||
              (event.payload.type === PosthogTriggerParams.Track &&
                event.payload.event === 'submit' &&
                trigger.providerParams === PosthogTriggerParams.Submit) ||
              (event.payload.type === PosthogTriggerParams.Track &&
                event.payload.event === '$pageleave' &&
                trigger.providerParams === PosthogTriggerParams.Pageleave) ||
              (event.payload.type === PosthogTriggerParams.Track &&
                event.payload.event === '$rageclick' &&
                trigger.providerParams === PosthogTriggerParams.Rageclick) ||
              (event.payload.type === PosthogTriggerParams.Page &&
                event.payload.event === '$pageview' &&
                trigger.providerParams === PosthogTriggerParams.Pageview) ||
              (event.payload.type === PosthogTriggerParams.Track &&
                event.payload.event === trigger.providerParams)
            )
          ) {
            continue;
          }

          switch (trigger.type) {
            case TriggerType.EVENT:
              if (customer) {
                try {
                  from = await queryRunner.manager.findOneBy(Audience, {
                    owner: { id: account.id },
                    id: trigger.source,
                  });

                  this.logger.debug('Source: ' + from?.id);
                } catch (err: any) {
                  this.logger.error('Error: ' + err);
                  jobId.failureReason = err;
                  jobId.status = 'Failed';
                  jobIds.push(jobId);
                  continue workflow_loop;
                  //return Promise.reject(err);
                }
                if (trigger?.dest?.length == 1) {
                  if (trigger.dest[0]) {
                    try {
                      to = await queryRunner.manager.findOneBy(Audience, {
                        owner: { id: account.id },
                        id: trigger.dest[0],
                      });
                      this.logger.debug('Dest: ' + to?.id);
                    } catch (err: any) {
                      this.logger.error('Error: ' + err);
                      jobId.failureReason = err;
                      jobId.status = 'Failed';
                      jobIds.push(jobId);
                      continue workflow_loop;
                      // return Promise.reject(err);
                    }
                  }

                  const { conditions } = trigger.properties;
                  let eventIncluded = true;
                  this.logger.debug(
                    'Event conditions: ' + JSON.stringify(conditions)
                  );
                  if (conditions && conditions.length > 0) {
                    const compareResults = await Promise.all(
                      conditions.map(async (condition) => {
                        if (
                          condition.key == 'current_url' &&
                          trigger.providerType == ProviderTypes.Posthog &&
                          trigger.providerParams ===
                            PosthogTriggerParams.Pageview
                        ) {
                          // this.logger.debug(
                          //   `Comparing: ${event?.event?.page?.url || ''} ${
                          //     condition.comparisonType || ''
                          //   } ${condition.value || ''}`
                          // );
                          return false;
                          // ['exists', 'doesNotExist'].includes(
                          //   condition.comparisonType
                          // )
                          //   ? this.audiencesHelper.operableCompare(
                          //       event?.event?.page?.url,
                          //       condition.comparisonType
                          //     )
                          //   : await this.audiencesHelper.conditionalCompare(
                          //       event?.event?.page?.url,
                          //       condition.value,
                          //       condition.comparisonType
                          //     );
                        } else if (
                          condition.filterBy === FilterByOption.ELEMENTS
                        ) {
                          // const elementToCompare = event?.event?.elements?.find(
                          //   (el) => el?.order === condition.elementOrder
                          // )?.[
                          //   condition.filter ===
                          //   EventConditionElementsFilter.TEXT
                          //     ? 'text'
                          //     : 'tagtag_name_name'
                          // ];
                          // console.log(
                          //   `Comparing: ${elementToCompare} ${
                          //     condition.comparisonType || ''
                          //   } ${condition.value || ''}`
                          // );
                          return false;
                          // await this.audiencesHelper.conditionalCompare(
                          //   elementToCompare,
                          //   condition.value,
                          //   condition.comparisonType
                          // );
                        } else {
                          this.logger.debug(
                            `Comparing: ${
                              event?.event?.[condition.key] || ''
                            } ${condition.comparisonType || ''} ${
                              condition.value || ''
                            }`
                          );
                          return ['exists', 'doesNotExist'].includes(
                            condition.comparisonType
                          )
                            ? this.audiencesHelper.operableCompare(
                                event?.event?.[condition.key],
                                condition.comparisonType
                              )
                            : await this.audiencesHelper.conditionalCompare(
                                event?.event?.[condition.key],
                                condition.value,
                                condition.comparisonType
                              );
                        }
                      })
                    );
                    this.logger.debug(
                      'Compare result: ' + JSON.stringify(compareResults)
                    );

                    if (compareResults.length > 1) {
                      const compareTypes = conditions.map(
                        (condition) => condition.relationWithNext
                      );
                      eventIncluded =
                        this.audiencesHelper.conditionalComposition(
                          compareResults,
                          compareTypes
                        );
                    } else {
                      eventIncluded = compareResults[0];
                    }
                  }

                  this.logger.debug('Event included: ' + eventIncluded);

                  if (
                    from.customers.indexOf(customer?.id) > -1 &&
                    eventIncluded
                  ) {
                    try {
                      const { jobIds: jobIdArr, templates } =
                        await this.audiencesService.moveCustomer(
                          account,
                          from?.id,
                          to?.id,
                          customer,
                          event,
                          queryRunner,
                          workflow.rules,
                          workflow.id,
                          session
                        );
                      this.logger.debug(
                        'Moved ' +
                          customer?.id +
                          ' out of ' +
                          from?.id +
                          ' and into ' +
                          to?.id
                      );
                      jobId.jobIds = jobIdArr;
                      jobId.templates = templates;
                      jobIds.push(jobId);
                    } catch (err: any) {
                      this.logger.error('Error: ' + err);
                      jobId.failureReason = err;
                      jobId.status = 'Failed';
                      jobIds.push(jobId);
                      break workflow_loop;
                      // return Promise.reject(err);
                    }
                    interrupt = true;
                  }
                } else {
                  //TODO: Branch Triggers
                }
              }
              break;
            case TriggerType.TIME_DELAY: //TODO
              break;
            case TriggerType.TIME_WINDOW: //TODO
              break;
          }
        }
      }
    } catch (err) {
      this.logger.error(
        `workflows.service.ts:WorkflowsService.tick Error: ${err}`
      );
      return Promise.reject(err);
    }
    return Promise.resolve(jobIds);
  }

  /**
   * Delete a workflow
   *
   * @remarks
   * TODO: Error handling
   *
   * @param account - The owner of the workflow
   * @param name - the name of the workflow to delete
   *
   */
  async remove(account: Account, name: string, session: string): Promise<void> {
    await this.workflowsRepository.delete({
      owner: { id: account.id },
      name,
    });
  }

  async setPaused(
    account: Account,
    id: string,
    value: boolean,
    session: string,
    queryRunner = this.dataSource.createQueryRunner()
  ) {
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const found: Workflow = await queryRunner.manager.findOneBy(Workflow, {
        owner: { id: account.id },
        id,
      });

      if (value) {
        found.latestPause = new Date();
      } else {
        if (found.latestPause) {
          const jobs = await queryRunner.manager.findBy(Job, {
            workflow: { id: found.id },
            type: TimeJobType.DELAY,
          });
          await queryRunner.manager.save(
            jobs.map((item) => ({
              ...item,
              executionTime: new Date(
                new Date().getTime() -
                  found.latestPause.getTime() +
                  item.executionTime.getTime()
              ),
            }))
          );
        }
        found.latestPause = null;
      }

      if (found?.isStopped)
        throw new HttpException('The workflow has already been stopped', 400);
      await queryRunner.manager.save(Workflow, {
        ...found,
        isPaused: value,
      });

      await queryRunner.commitTransaction();

      return value;
    } catch (error) {
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  async setStopped(
    account: Account,
    id: string,
    value: boolean,
    session: string
  ) {
    const found: Workflow = await this.workflowsRepository.findOneBy({
      owner: { id: account.id },
      id,
    });
    if (!found?.isActive)
      throw new HttpException('The workflow was not activated', 400);
    await this.workflowsRepository.save({
      ...found,
      isStopped: value,
    });
    return value;
  }

  async markFlowDeleted(workflowId: string, session: string) {
    await this.workflowsRepository.update(
      { id: workflowId },
      {
        isActive: true,
        isDeleted: true,
        isPaused: true,
        isStopped: true,
      }
    );
    return;
  }

  async timeTick(job: Job, session: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const acct = await queryRunner.manager.findOneBy(Account, {
        id: job.owner.id,
      });
      const found = await queryRunner.manager.findOne(Workflow, {
        where: { id: job.workflow.id },
      });
      this.logger.debug('Found Workflow for Job: ' + found.id);
      if (found.isActive) {
        this.logger.debug('Looking for customer...');
        const customer = await this.customersService.findById(
          acct,
          job.customer
        );
        this.logger.debug('Found customer for Job: ' + customer.id);
        await this.audiencesService.moveCustomer(
          acct,
          job.from.id,
          job.to.id,
          customer,
          null,
          queryRunner,
          found.rules,
          found.id,
          session
        );
      }
      await queryRunner.commitTransaction();
    } catch (e) {
      await queryRunner.rollbackTransaction();
      throw e;
    } finally {
      await queryRunner.release();
    }
  }
}
