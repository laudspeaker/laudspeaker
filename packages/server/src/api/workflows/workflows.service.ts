import {
  LoggerService,
  Inject,
  Injectable,
  HttpException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { AudiencesService } from '../audiences/audiences.service';
import { UpdateWorkflowDto } from './dto/update-workflow.dto';
import { Trigger, TriggerType, Workflow } from './entities/workflow.entity';
import errors from '@/shared/utils/errors';
import { Audience } from '../audiences/entities/audience.entity';
import { CustomersService } from '../customers/customers.service';
import { CustomerDocument } from '../customers/schemas/customer.schema';
import { Job } from 'bull';
import { EventDto } from '../events/dto/event.dto';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Stats } from '../audiences/entities/stats.entity';

@Injectable()
export class WorkflowsService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(Workflow)
    private workflowsRepository: Repository<Workflow>,
    @InjectRepository(Stats) private statsRepository: Repository<Stats>,
    @Inject(AudiencesService) private audiencesService: AudiencesService,
    @Inject(CustomersService) private customersService: CustomersService
  ) {}

  /**
   * Finds all workflows
   *
   * @param account - The owner of the workflows
   *
   */
  findAll(account: Account): Promise<Workflow[]> {
    return this.workflowsRepository.findBy({ ownerId: (<Account>account).id });
  }

  /**
   * Finds all active workflows
   *
   * @param account - The owner of the workflows
   *
   */
  findAllActive(account: Account): Promise<Workflow[]> {
    return this.workflowsRepository.findBy({
      ownerId: (<Account>account).id,
      isActive: true,
      isStopped: false,
      isPaused: false,
    });
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
      found = await this.workflowsRepository.findOneBy({
        ownerId: (<Account>account).id,
        name: name,
      });
    } catch (err) {
      this.logger.error('Error: ' + err);
      return Promise.reject(err);
    }
    try {
      if (needStats && found) {
        const foundStats = await this.statsRepository.find({
          where: {
            audience: {
              id: In(
                found?.visualLayout?.nodes
                  ?.map((node) => node.data.audienceId)
                  .filter((str) => !!str) || []
              ),
            },
          },
          relations: ['audience'],
        });
        found.visualLayout.nodes = found.visualLayout.nodes.map((node) => ({
          ...node,
          data: {
            ...node.data,
            stats: ((
              val = foundStats.find(
                (stat) => stat.audience.id === node.data.audienceId
              )
            ) => (val ? { sentAmount: val.sentAmount } : null))(),
          },
        }));
      }
    } catch (e) {
      console.error(e);
    }

    if (found) {
      this.logger.debug('Found workflow: ' + found);
      return found;
    } else {
      const workflow = new Workflow();
      workflow.name = name;
      workflow.audiences = [];
      workflow.ownerId = (<Account>account).id;
      let ret: Workflow;
      try {
        ret = await this.workflowsRepository.save(workflow);
        this.logger.debug('Created workflow: ' + ret);
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
    const rules: string[] = [];
    for (let index = 0; index < updateWorkflowDto.rules?.length; index++)
      rules.push(
        Buffer.from(JSON.stringify(updateWorkflowDto.rules[index])).toString(
          'base64'
        )
      );
    const found = await this.workflowsRepository.findOneBy({
      ownerId: (<Account>account).id,
      id: updateWorkflowDto.id,
    });
    if (found?.isActive)
      return Promise.reject(new Error('Workflow has already been activated'));
    try {
      await this.workflowsRepository.update(
        { ownerId: (<Account>account).id, id: updateWorkflowDto.id },
        {
          audiences: updateWorkflowDto.audiences,
          name: updateWorkflowDto.name,
          visualLayout: updateWorkflowDto.visualLayout,
          rules: rules,
        }
      );
      this.logger.debug('Updated workflow ' + updateWorkflowDto.id);
    } catch (err) {
      this.logger.error('Error:' + err);
      return Promise.reject(err);
    }
    return;
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
  async start(account: Account, workflowID: string): Promise<void> {
    let workflow: Workflow; // Workflow to update
    let audience: Audience; // Audience to freeze/send messages to
    let customers: CustomerDocument[]; // Customers to add to primary audience
    let saved: Workflow;
    try {
      workflow = await this.workflowsRepository.findOneBy({
        ownerId: (<Account>account).id,
        id: workflowID,
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
      return Promise.resolve();
    }
    if (workflow?.isStopped)
      return Promise.reject(new Error('The workflow has already been stopped'));
    try {
      saved = await this.workflowsRepository.save({
        ...workflow,
        isActive: true,
      });
      this.logger.debug('Started workflow ' + saved.id);
    } catch (err) {
      this.logger.error('Error: ' + err);
      return Promise.reject(err);
    }
    for (let index = 0; index < saved.audiences.length; index++) {
      try {
        audience = await this.audiencesService.findOne(
          account,
          saved.audiences[index]
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
        audience = await this.audiencesService.freeze(account, audience.id);
        this.logger.debug('Freezing audience ' + audience.id);
      } catch (err) {
        this.logger.error('Error: ' + err);
        return Promise.reject(err);
      }
      if (audience.isPrimary) {
        try {
          customers = await this.customersService.findByInclusionCriteria(
            account,
            audience.inclusionCriteria
          );
          this.logger.debug('Customers to include in workflow: ' + customers);
        } catch (err) {
          this.logger.error('Error: ' + err);
          return Promise.reject(err);
        }
        try {
          await this.audiencesService.moveCustomers(
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
      }
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
    customer: CustomerDocument
  ): Promise<void> {
    let workflows: Workflow[], // Active workflows for this account
      workflow: Workflow, // Workflow being updated
      audience: Audience; // Primary audience to add customer to
    try {
      workflows = await this.findAllActive(account);
      this.logger.debug('Active workflows: ' + workflows);
    } catch (err) {
      this.logger.error('Error: ' + err);
      return Promise.reject(err);
    }
    for (
      let workflowsIndex = 0;
      workflowsIndex < workflows.length;
      workflowsIndex++
    ) {
      workflow = workflows[workflowsIndex];
      for (
        let audienceIndex = 0;
        audienceIndex < workflow.audiences.length;
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
          audience.isDynamic &&
          this.customersService.checkInclusion(
            customer,
            audience.inclusionCriteria
          )
        ) {
          try {
            await this.audiencesService.moveCustomer(
              account,
              null,
              audience.id,
              customer.id,
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
  ): Promise<Job<any>> {
    let workflows: Workflow[], // Active workflows for this account
      workflow: Workflow, // Workflow being updated
      customer: CustomerDocument, // Customer to be found
      trigger: Trigger, // Trigger being processed
      from: Audience, //  Audience to move customer out of
      to: Audience, // Audience to move customer into
      job: Job<any>;
    let interrupt = false; // Interrupt the tick to avoid the same event triggering two customer moves
    if (event) {
      try {
        customer = await this.customersService.findByCorrelationKVPair(
          account,
          event.correlationKey,
          event.correlationValue
        );
        this.logger.debug('Found customer: ' + customer);
      } catch (err) {
        this.logger.error('Error: ' + err);
        return Promise.reject(err);
      }
    }
    try {
      workflows = await this.findAllActive(account);
      this.logger.debug('Found active workflows: ' + workflows);
    } catch (err) {
      this.logger.error('Error: ' + err);
      return Promise.reject(err);
    }
    for (
      let workflowsIndex = 0;
      workflowsIndex < workflows.length;
      workflowsIndex++
    ) {
      workflow = workflows[workflowsIndex];
      for (
        let triggerIndex = 0;
        triggerIndex < workflow.rules?.length;
        triggerIndex++
      ) {
        if (interrupt) {
          interrupt = false;
          break;
        }
        trigger = JSON.parse(
          Buffer.from(workflow.rules[triggerIndex], 'base64').toString('ascii')
        );
        switch (trigger.type) {
          case TriggerType.event:
            if (customer) {
              try {
                from = await this.audiencesService.findOne(
                  account,
                  trigger.source
                );
                this.logger.debug('Source: ' + from.id);
              } catch (err) {
                this.logger.error('Error: ' + err);
                return Promise.reject(err);
              }
              if (trigger.dest.length == 1) {
                try {
                  to = await this.audiencesService.findOne(
                    account,
                    trigger.dest[0]
                  );
                  this.logger.debug('Dest: ' + to.id);
                } catch (err) {
                  this.logger.error('Error: ' + err);
                  return Promise.reject(err);
                } console.log(from.customers.indexOf(customer.id));
                console.log(trigger.properties.event);
                console.log(event.event);
                if (
                  from.customers.indexOf(customer.id) > -1 &&
                  trigger.properties.event == event.event
                ) {
                  try {
                    console.log("ya ya 3");
                    job = await this.audiencesService.moveCustomer(
                      account,
                      from.id,
                      to.id,
                      customer.id,
                      event
                    );
                    const stats = await this.statsRepository.findOne({
                      where: {
                        audience: { id: to.id },
                      },
                      relations: ['audience'],
                    });
                    stats.sentAmount++;
                    await this.statsRepository.save(stats);
                    this.logger.debug(
                      'Moving' +
                        customer.id +
                        'out of  ' +
                        from.id +
                        ' and into ' +
                        to.id
                    );
                  } catch (err) {
                    this.logger.error('Error: ' + err);
                    return Promise.reject(err);
                  }
                  interrupt = true;
                }
              } else {
                //TODO: Branch Triggers
              }
              return Promise.resolve(job);
            }
            break;
          case TriggerType.time_delay: //TODO
            break;
          case TriggerType.time_window: //TODO
            break;
        }
      }
    }
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
    if (found.isStopped)
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
    if (!found.isActive)
      throw new HttpException('The workflow was not activated', 400);
    await this.workflowsRepository.save({
      ...found,
      isStopped: value,
    });
    return value;
  }
}
