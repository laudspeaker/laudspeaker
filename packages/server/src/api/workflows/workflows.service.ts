import {
  LoggerService,
  Inject,
  Injectable,
  HttpException,
  NotFoundException,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, QueryRunner, Repository } from 'typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { AudiencesService } from '../audiences/audiences.service';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import {
  PosthogTriggerParams,
  ProviderTypes,
  Trigger,
  TriggerType,
  Workflow,
} from './entities/workflow.entity';

import { Audience } from '../audiences/entities/audience.entity';
import { CustomersService } from '../customers/customers.service';
import { CustomerDocument } from '../customers/schemas/customer.schema';
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
import {
  conditionalCompare,
  conditionalComposition,
  operableCompare,
} from '../audiences/audiences.helper';
import { Segment } from '../segments/entities/segment.entity';
import { AppDataSource } from '@/data-source';
import { Template } from '../templates/entities/template.entity';
import { InjectQueue } from '@nestjs/bull';
import { JobTypes } from '../events/interfaces/event.interface';
import { Queue } from 'bull';
import { BadRequestException } from '@nestjs/common/exceptions';
import { Job, TimeJobType } from '../jobs/entities/job.entity';

@Injectable()
export class WorkflowsService {
  private clickhouseClient = createClient({
    host: process.env.CLICKHOUSE_HOST ?? 'http://localhost:8123',
    username: process.env.CLICKHOUSE_USER ?? 'default',
    password: process.env.CLICKHOUSE_PASSWORD ?? '',
  });

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(Workflow)
    private workflowsRepository: Repository<Workflow>,
    @InjectRepository(Segment) private segmentsRepository: Repository<Segment>,
    @InjectRepository(Account)
    private usersRepository: Repository<Account>,
    @Inject(AudiencesService) private audiencesService: AudiencesService,
    @Inject(CustomersService) private customersService: CustomersService,
    @InjectModel(EventKeys.name)
    private EventKeysModel: Model<EventKeysDocument>,
    private dataSource: DataSource,
    @InjectQueue(JobTypes.events)
    private readonly eventsQueue: Queue,
    @InjectConnection() private readonly connection: mongoose.Connection
  ) { }

  /**
   * Finds all workflows
   *
   * @param account - The owner of the workflows
   *
   */
  async findAll(
    account: Account,
    take = 100,
    skip = 0,
    orderBy?: keyof Workflow,
    orderType?: 'asc' | 'desc',
    showDisabled?: boolean
  ): Promise<{ data: Workflow[]; totalPages: number }> {
    try {
      const totalPages = Math.ceil(
        (await this.workflowsRepository.count({
          where: {
            owner: { id: account.id },
            isDeleted: In([!!showDisabled, false]),
          },
        })) / take || 1
      );
      const orderOptions = {};
      if (orderBy && orderType) {
        orderOptions[orderBy] = orderType;
      }
      const workflows = await this.workflowsRepository.find({
        where: {
          owner: { id: account.id },
          isDeleted: In([!!showDisabled, false]),
        },
        order: orderOptions,
        take: take < 100 ? take : 100,
        skip,
      });
      return { data: workflows, totalPages };
    }
    catch (err) {
      this.logger.error(`workflows.service.ts:WorkflowsService.findAll: Error: ${err}`);
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
      relations: ['segment'],
    });
  }

  private async getStats(audienceId?: string) {
    if (!audienceId) return {};
    const sentResponse = await this.clickhouseClient.query({
      query: `SELECT COUNT(*) FROM message_status WHERE event = 'delivered' AND audienceId = {audienceId:UUID}`,
      query_params: { audienceId },
    });
    const sentData = (await sentResponse.json<any>())?.data;
    const sent = +sentData?.[0]?.['count()'] || 0;

    const clickedResponse = await this.clickhouseClient.query({
      query: `SELECT COUNT(*) FROM message_status WHERE event = 'clicked' AND audienceId = {audienceId:UUID}`,
      query_params: { audienceId },
    });
    const clickedData = (await clickedResponse.json<any>())?.data;
    const clicked = +clickedData?.[0]?.['count()'];

    const clickedPercentage = (clicked / sent) * 100;

    return {
      sent,
      clickedPercentage,
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
    needStats: boolean
  ): Promise<Workflow> {
    if (!isUUID(id)) throw new BadRequestException('Id is not valid uuid');

    let found: Workflow;
    try {
      found = await this.workflowsRepository.findOne({
        where: {
          owner: { id: account.id },
          id,
        },
        relations: ['segment'],
      });
    } catch (err) {
      this.logger.error(`workflows.service.ts:WorkflowsService.findOne: Error: ${err}`);
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
      this.logger.error(`workflows.service.ts:WorkflowsService.findOne: Error: ${e}`);
    }

    this.logger.debug('Found workflow: ' + found?.id);
    return found;
  }

  async create(account: Account, name: string) {
    let ret: Workflow;
    try {
      ret = await this.workflowsRepository.save({
        name,
        audiences: [],
        owner: { id: account.id },
      });
      this.logger.debug('Created workflow: ' + ret?.id);
    } catch (err) {
      this.logger.error(`workflows.service.ts:WorkflowsService.findOne: Error: ${err}`);
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
    queryRunner = AppDataSource.createQueryRunner()
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
        relations: ['segment'],
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
              }).exec();
              if (!eventKey)
                await this.EventKeysModel.create({
                  key,
                  type,
                  isArray,
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

      let segmentId = workflow.segment?.id;
      if (updateWorkflowDto.segmentId !== undefined) {
        segmentId = updateWorkflowDto.segmentId;
      }

      await queryRunner.manager.save(Workflow, {
        ...workflow,
        segment: { id: segmentId },
        audiences,
        visualLayout,
        isDynamic,
        name,
      });
      this.logger.debug('Updated workflow ' + updateWorkflowDto.id);

      if (!alreadyInsideTransaction) await queryRunner.commitTransaction();
    } catch (e) {
      this.logger.error(`workflows.service.ts:WorkflowsService.update: Error: ${e}`);
      if (!alreadyInsideTransaction) await queryRunner.rollbackTransaction();
    } finally {
      if (!alreadyInsideTransaction) await queryRunner.release();
    }
  }

  async duplicate(user: Account, id: string) {
    const oldWorkflow = await this.workflowsRepository.findOne({
      where: {
        owner: { id: user.id },
        id,
      },
      relations: ['segment'],
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
    const newWorkflow = await this.create(user, newName);

    const oldAudiences = await this.audiencesService.audiencesRepository.find({
      where: { workflow: { id: oldWorkflow.id } },
      relations: ['workflow', 'owner'],
    });

    const queryRunner = AppDataSource.createQueryRunner();
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
          segmentId: oldWorkflow.segment?.id,
          isDynamic: oldWorkflow.isDynamic,
        },
        queryRunner
      );

      await queryRunner.commitTransaction();
    } catch (e) {
      this.logger.error(`workflows.service.ts:WorkflowsService.duplicate: Error: ${e}`);
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
    workflowID: string
  ): Promise<(string | number)[]> {
    try {
      this.logger.debug(`workflow.service.ts:WorkflowService.start: Account attempting to start workflow: ${JSON.stringify(account, null, 2)}`);
      const job = await this.eventsQueue.add('start', {
        accountId: account.id.toString(),
        workflowID,
      });
      const data = await job.finished();
      return data;
    } catch (e) {
      this.logger.error(`workflows.service.ts:WorkflowsService.start: Error: ${e}`);
      if (e instanceof Error)
        throw new HttpException(e.message, HttpStatus.BAD_REQUEST);
    }
  }

  /**
   * Adds a customer to dynamic primary audience of all active workflows,
   * and sends them any relevant messages. Similar to  start,
   * one customer -> many workflows
   *
   * @remarks
   * Throws an error if the workflow is not found
   *
   * @param account - The owner of the workflow
   * @param updateAudienceDto - DTO with the updated information
   *
   */
  async enrollCustomer(
    account: Account,
    customer: CustomerDocument,
    queryRunner: QueryRunner
  ): Promise<void> {
    try {
      const workflows = await queryRunner.manager.find(Workflow, {
        where: {
          owner: { id: account.id },
          isActive: true,
          isStopped: false,
          isPaused: false,
        },
        relations: ['segment'],
      });
      this.logger.debug('Active workflows: ' + workflows?.length);

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
            this.customersService.checkInclusion(
              customer,
              workflow.segment.inclusionCriteria
            )
          ) {
            await this.audiencesService.moveCustomer(
              account,
              null,
              audience?.id,
              customer,
              null,
              queryRunner,
              workflow.rules,
              workflow.id
            );
            this.logger.debug('Enrolled customer in dynamic primary audience.');
          }
        }
      }
    } catch (err) {
      this.logger.error(`workflows.service.ts:WorkflowsService.enrollCustomer: Error: ${err}`);
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
    transactionSession: ClientSession
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
        this.logger.debug('Found customer: ' + customer?.id);
      }
      workflows = await queryRunner.manager.find(Workflow, {
        where: {
          owner: { id: account.id },
          isActive: true,
          isStopped: false,
          isPaused: false,
        },
        relations: ['segment'],
      });
      this.logger.debug('Found active workflows: ' + workflows.length);

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
              //for autocapture
              (
                (event.payload.type === PosthogTriggerParams.Track &&
                  event.payload.event === 'click' &&
                  trigger.providerParams ===
                  PosthogTriggerParams.Autocapture) ||
                // for page
                (event.payload.type === PosthogTriggerParams.Page &&
                  trigger.providerParams === PosthogTriggerParams.Page) ||
                // for custom
                (event.payload.type === PosthogTriggerParams.Track &&
                  event.payload.event !== 'click' &&
                  event.payload.event === trigger.providerParams)
              )
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
                    const compareResults = conditions.map((condition) => {
                      this.logger.debug(
                        `Comparing: ${event?.event?.[condition.key] || ''} ${condition.comparisonType || ''
                        } ${condition.value || ''}`
                      );
                      return ['exists', 'doesNotExist'].includes(
                        condition.comparisonType
                      )
                        ? operableCompare(
                          event?.event?.[condition.key],
                          condition.comparisonType
                        )
                        : conditionalCompare(
                          event?.event?.[condition.key],
                          condition.value,
                          condition.comparisonType
                        );
                    });
                    this.logger.debug(
                      'Compare result: ' + JSON.stringify(compareResults)
                    );

                    if (compareResults.length > 1) {
                      const compareTypes = conditions.map(
                        (condition) => condition.relationWithNext
                      );
                      eventIncluded = conditionalComposition(
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
                          workflow.id
                        );
                      this.logger.debug(
                        'Moving ' +
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
      this.logger.error(`workflows.service.ts:WorkflowsService.tick Error: ${err}`);
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
  async remove(account: Account, name: string): Promise<void> {
    await this.workflowsRepository.delete({
      owner: { id: account.id },
      name,
    });
  }

  async setPaused(
    account: Account,
    id: string,
    value: boolean,
    queryRunner = AppDataSource.createQueryRunner()
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

  async setStopped(account: Account, id: string, value: boolean) {
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

  async markFlowDeleted(workflowId: string) {
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

  async timeTick(job: Job) {
    const queryRunner = AppDataSource.createQueryRunner();
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
          found.id
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
