import {
  LoggerService,
  Inject,
  Injectable,
  HttpException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
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
import errors from '@/shared/utils/errors';
import { Audience } from '../audiences/entities/audience.entity';
import { CustomersService } from '../customers/customers.service';
import { CustomerDocument } from '../customers/schemas/customer.schema';
import { EventDto } from '../events/dto/event.dto';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Stats } from '../audiences/entities/stats.entity';
import { createClient } from '@clickhouse/client';
import {
  PosthogKeysPayload,
  WorkflowTick,
} from './interfaces/workflow-tick.interface';
import { isBoolean, isString } from 'class-validator';
import {
  EventKeys,
  EventKeysDocument,
} from '../events/schemas/event-keys.schema';
import { Model } from 'mongoose';
import { InjectModel } from '@nestjs/mongoose';
import {
  conditionalCompare,
  conditionalComposition,
  operableCompare,
} from '../audiences/audiences.helper';
import { Segment } from '../segments/entities/segment.entity';

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
    @InjectRepository(Stats) private statsRepository: Repository<Stats>,
    @InjectRepository(Segment) private segmentsRepository: Repository<Segment>,
    @Inject(AudiencesService) private audiencesService: AudiencesService,
    @Inject(CustomersService) private customersService: CustomersService,
    @InjectModel(EventKeys.name)
    private EventKeysModel: Model<EventKeysDocument>,
    private dataSource: DataSource
  ) {}

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
    const totalPages = Math.ceil(
      (await this.workflowsRepository.count({
        where: { ownerId: (<Account>account).id },
      })) / take || 1
    );
    const orderOptions = {};
    if (orderBy && orderType) {
      orderOptions[orderBy] = orderType;
    }
    const workflows = await this.workflowsRepository.find({
      where: {
        ownerId: (<Account>account).id,
        isDeleted: In([!!showDisabled, false]),
      },
      order: orderOptions,
      take: take < 100 ? take : 100,
      skip,
    });
    return { data: workflows, totalPages };
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
        ownerId: (<Account>account).id,
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
    name: string,
    needStats: boolean
  ): Promise<Workflow> {
    let found: Workflow;
    try {
      found = await this.workflowsRepository.findOne({
        where: {
          ownerId: (<Account>account).id,
          name: name,
        },
        relations: ['segment'],
      });
    } catch (err) {
      this.logger.error('Error: ' + err);
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
    } catch (e) {
      console.error(e);
    }

    if (found) {
      this.logger.debug('Found workflow: ' + found?.id);
      return found;
    } else {
      const workflow = new Workflow();
      workflow.name = name;
      workflow.audiences = [];
      workflow.ownerId = (<Account>account).id;
      let ret: Workflow;
      try {
        ret = await this.workflowsRepository.save(workflow);
        this.logger.debug('Created workflow: ' + ret?.id);
      } catch (err) {
        this.logger.error('Error: ' + err);
        return Promise.reject(err);
      }
      return Promise.resolve(ret); //await this.workflowsRepository.save(workflow)
    }
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
    updateWorkflowDto: UpdateWorkflowDto
  ): Promise<void> {
    const workflow = await this.workflowsRepository.findOne({
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
        newRules.push(Buffer.from(JSON.stringify(trigger)).toString('base64'));
      }
      workflow.rules = newRules;
    }

    if (visualLayout) {
      for (const node of visualLayout.nodes) {
        const audienceId = node?.data?.audienceId;
        const nodeTemplates = node?.data?.messages;
        if (!nodeTemplates || !Array.isArray(nodeTemplates) || !audienceId)
          continue;

        await this.audiencesService.audiencesRepository.update(
          {
            id: audienceId,
            ownerId: account.id,
          },
          {
            templates: nodeTemplates.map((item) => item.templateId),
          }
        );
      }
    }

    let segmentId = workflow.segment?.id;
    if (updateWorkflowDto.segmentId !== undefined) {
      segmentId = updateWorkflowDto.segmentId;
    }

    try {
      await this.workflowsRepository.save({
        ...workflow,
        segment: { id: segmentId },
        audiences,
        visualLayout,
        isDynamic,
        name,
      });
      this.logger.debug('Updated workflow ' + updateWorkflowDto.id);
    } catch (err) {
      this.logger.error('Error:' + err);
      return Promise.reject(err);
    }
    return;
  }

  async duplicate(user: Account, id: string) {
    const oldWorkflow = await this.workflowsRepository.findOne({
      where: {
        ownerId: user.id,
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
    const newWorkflow = await this.findOne(user, newName, false);

    const newAudiences = await Promise.all(
      oldWorkflow.audiences?.map(async (id) => {
        const { name, description, isPrimary, templates } =
          await this.audiencesService.findOne(user, id);
        const newAudience = await this.audiencesService.insert(user, {
          name,
          description,
          isPrimary,
          templates,
        });
        return newAudience.id;
      }) || []
    );

    let visualLayout = JSON.stringify(oldWorkflow.visualLayout);
    const rules = oldWorkflow.rules?.map((rule) =>
      Buffer.from(rule, 'base64').toString()
    );

    for (let i = 0; i < oldWorkflow.audiences.length; i++) {
      const oldAudience = oldWorkflow.audiences[i];
      const newAudience = newAudiences[i];
      visualLayout = visualLayout.replaceAll(oldAudience, newAudience);
      for (let i = 0; i < rules.length; i++) {
        rules[i] = rules[i].replaceAll(oldAudience, newAudience);
      }
    }

    visualLayout = JSON.parse(visualLayout);
    const triggers: Trigger[] = rules?.map((rule) => JSON.parse(rule));

    await this.update(user, {
      id: newWorkflow.id,
      audiences: newAudiences,
      name: newName,
      visualLayout,
      rules: triggers,
      segmentId: oldWorkflow.segment.id,
      isDynamic: oldWorkflow.isDynamic,
    });
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
    let workflow: Workflow; // Workflow to update
    let audience: Audience; // Audience to freeze/send messages to
    let customers: CustomerDocument[]; // Customers to add to primary audience
    let jobIDs: (string | number)[] = [];
    try {
      workflow = await this.workflowsRepository.findOne({
        where: {
          ownerId: (<Account>account).id,
          id: workflowID,
        },
        relations: ['segment'],
      });
      if (!workflow) {
        this.logger.debug('Workflow does not exist');
        return Promise.reject(errors.ERROR_DOES_NOT_EXIST);
      }
    } catch (err) {
      this.logger.error('Error: ' + err);
      return Promise.reject(err);
    }
    if (workflow.isActive) {
      this.logger.debug('Workflow already active');
      return Promise.reject(new Error('Workflow already active'));
    }
    if (workflow?.isStopped)
      return Promise.reject(new Error('The workflow has already been stopped'));
    for (let index = 0; index < workflow?.audiences?.length; index++) {
      try {
        audience = await this.audiencesService.findOne(
          account,
          workflow.audiences[index]
        );
        if (!audience) {
          this.logger.error('Error: Workflow contains nonexistant audience');
          return Promise.reject(errors.ERROR_DOES_NOT_EXIST);
        }
      } catch (err) {
        this.logger.error('Error: ' + err);
        return Promise.reject(err);
      }
      try {
        audience = await this.audiencesService.freeze(account, audience?.id);
        this.logger.debug('Freezing audience ' + audience?.id);
      } catch (err) {
        this.logger.error('Error: ' + err);
        return Promise.reject(err);
      }
      if (audience.isPrimary) {
        try {
          customers = await this.customersService.findByInclusionCriteria(
            account,
            workflow.segment.inclusionCriteria
          );
          this.logger.debug(
            'Customers to include in workflow: ' + customers.length
          );
        } catch (err) {
          this.logger.error('Error: ' + err);
          return Promise.reject(err);
        }
        try {
          jobIDs = await this.audiencesService.moveCustomers(
            account,
            null,
            audience,
            customers,
            null
          );
          this.logger.debug('Finished moving customers into workflow');
        } catch (err) {
          this.logger.error('Error: ' + err);
          return Promise.reject(err);
        }
        try {
          await this.workflowsRepository.save({
            ...workflow,
            isActive: true,
          });
          this.logger.debug('Started workflow ' + workflow?.id);
        } catch (err) {
          this.logger.error('Error: ' + err);
          return Promise.reject(err);
        }
      }
    }

    const segment = await this.segmentsRepository.findOneBy({
      id: workflow.segment.id,
    });
    await this.segmentsRepository.save({ ...segment, isFreezed: true });
    return Promise.resolve(jobIDs);
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
    customer: CustomerDocument
  ): Promise<void> {
    let workflows: Workflow[], // Active workflows for this account
      workflow: Workflow, // Workflow being updated
      audience: Audience; // Primary audience to add customer to
    try {
      workflows = await this.findAllActive(account);
      this.logger.debug('Active workflows: ' + workflows?.length);
    } catch (err) {
      this.logger.error('Error: ' + err);
      return Promise.reject(err);
    }
    for (
      let workflowsIndex = 0;
      workflowsIndex < workflows?.length;
      workflowsIndex++
    ) {
      workflow = workflows[workflowsIndex];
      for (
        let audienceIndex = 0;
        audienceIndex < workflow?.audiences?.length;
        audienceIndex++
      ) {
        try {
          audience = await this.audiencesService.findOne(
            account,
            workflow.audiences[audienceIndex]
          );
          this.logger.debug('Audience: ' + audience);
        } catch (err) {
          this.logger.error('Error: ' + err);
          return Promise.reject(err);
        }
        if (
          audience.isPrimary &&
          workflow.isDynamic &&
          this.customersService.checkInclusion(
            customer,
            workflow.segment.inclusionCriteria
          )
        ) {
          try {
            await this.audiencesService.moveCustomer(
              account,
              null,
              audience?.id,
              customer?.id,
              null
            );
            this.logger.debug('Enrolled customer in dynamic primary audience.');
          } catch (err) {
            this.logger.error('Error: ' + err);
            return Promise.reject(err);
          }
        }
      }
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
    event: EventDto | null | undefined
  ): Promise<WorkflowTick[]> {
    let workflows: Workflow[], // Active workflows for this account
      workflow: Workflow, // Workflow being updated
      customer: CustomerDocument, // Customer to be found
      trigger: Trigger, // Trigger being processed
      from: Audience, //  Audience to move customer out of
      to: Audience; // Audience to move customer into
    const jobIds: WorkflowTick[] = [];
    let jobIdArr: (string | number)[] = [];
    let interrupt = false; // Interrupt the tick to avoid the same event triggering two customer moves

    if (event) {
      try {
        customer = await this.customersService.findByCorrelationKVPair(
          account,
          event.correlationKey,
          event.correlationValue
        );
        this.logger.debug('Found customer: ' + customer?.id);
      } catch (err) {
        this.logger.error('Error: ' + err);
        return Promise.reject(err);
      }
    }
    try {
      workflows = await this.findAllActive(account);
      this.logger.debug('Found active workflows: ' + workflows.length);
    } catch (err) {
      this.logger.error('Error: ' + err);
      return Promise.reject(err);
    }
    workflow_loop: for (
      let workflowsIndex = 0;
      workflowsIndex < workflows?.length;
      workflowsIndex++
    ) {
      workflow = workflows[workflowsIndex];
      let jobId: WorkflowTick = {
        workflowId: workflow.id,
        jobIds: undefined,
        status: undefined,
        failureReason: undefined,
      };
      for (
        let triggerIndex = 0;
        triggerIndex < workflow?.rules?.length;
        triggerIndex++
      ) {
        if (interrupt) {
          interrupt = false;
          break;
        }
        trigger = JSON.parse(
          Buffer.from(workflow.rules[triggerIndex], 'base64').toString('ascii')
        );

        if (
          event.source === ProviderTypes.Posthog &&
          trigger.providerType === ProviderTypes.Posthog &&
          !(
            //for autocapture
            (
              (event.payload.type === PosthogTriggerParams.Track &&
                event.payload.event === 'click' &&
                trigger.providerParams === PosthogTriggerParams.Autocapture) ||
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
          case TriggerType.event:
            if (customer) {
              try {
                from = await this.audiencesService.findOne(
                  account,
                  trigger.source
                );
                this.logger.debug('Source: ' + from?.id);
              } catch (err) {
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
                    to = await this.audiencesService.findOne(
                      account,
                      trigger.dest[0]
                    );
                    this.logger.debug('Dest: ' + to?.id);
                  } catch (err) {
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
                      `Comparing: ${event?.event?.[condition.key] || ''} ${
                        condition.comparisonType || ''
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
                    jobIdArr = await this.audiencesService.moveCustomer(
                      account,
                      from?.id,
                      to?.id,
                      customer?.id,
                      event
                    );
                    if (to) {
                      const stats = await this.statsRepository.findOne({
                        where: {
                          audience: { id: to?.id },
                        },
                        relations: ['audience'],
                      });
                      stats.sentAmount++;
                      await this.statsRepository.save(stats);
                    }
                    this.logger.debug(
                      'Moving ' +
                        customer?.id +
                        ' out of ' +
                        from?.id +
                        ' and into ' +
                        to?.id
                    );
                    jobId.jobIds = jobIdArr;
                    jobIds.push(jobId);
                  } catch (err) {
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
          case TriggerType.time_delay: //TODO
            break;
          case TriggerType.time_window: //TODO
            break;
        }
      }
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
      ownerId: (<Account>account).id,
      name,
    });
  }

  async setPaused(account: Account, id: string, value: boolean) {
    const found: Workflow = await this.workflowsRepository.findOneBy({
      ownerId: (<Account>account).id,
      id,
    });
    if (found?.isStopped)
      throw new HttpException('The workflow has already been stopped', 400);
    await this.workflowsRepository.save({
      ...found,
      isPaused: value,
    });
    return value;
  }

  async setStopped(account: Account, id: string, value: boolean) {
    const found: Workflow = await this.workflowsRepository.findOneBy({
      ownerId: (<Account>account).id,
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
}
