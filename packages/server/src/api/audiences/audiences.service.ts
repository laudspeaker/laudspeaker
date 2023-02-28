import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryRunner, Repository } from 'typeorm';
import { Audience } from './entities/audience.entity';
import { CreateAudienceDto } from './dto/create-audience.dto';
import { UpdateAudienceDto } from './dto/update-audience.dto';
import { Account } from '../accounts/entities/accounts.entity';
import { CustomerDocument } from '../customers/schemas/customer.schema';
import { Template } from '../templates/entities/template.entity';
import Errors from '../../shared/utils/errors';
import { TemplatesService } from '../templates/templates.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Workflow } from '../workflows/entities/workflow.entity';
import { EventDto } from '../events/dto/event.dto';
import { JobsService } from '../jobs/jobs.service';
import { DateTime } from 'luxon';
import { TimeJobType } from '../jobs/entities/job.entity';

@Injectable()
export class AudiencesService {
  /**
   * Audience service constructor; this class is the only class that should
   * be using the Audiences repository (`Repository<Audience>`) directly.
   * @class
   */
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(Audience)
    public audiencesRepository: Repository<Audience>,
    @InjectRepository(Workflow)
    private workflowRepository: Repository<Workflow>,
    @Inject(TemplatesService) public templatesService: TemplatesService,
    @Inject(JobsService) public jobsService: JobsService
  ) { }

  /**
   * Find all audiences that belong to a given account. If
   * not found, returns empty array
   *
   * @param account - The owner of the audiences
   *
   */
  findAll(account: Account): Promise<Audience[]> {
    return this.audiencesRepository.findBy({
      owner: { id: account.id },
    });
  }

  /**
   * Returns the first audience belonging to the given account with
   * the sepcified 'name' field. If not found, returns null
   *
   * @param account - The owner of the audience
   * @param name - name used for lookup
   *
   */
  findByName(account: Account, name: string): Promise<Audience | null> {
    return this.audiencesRepository.findOneBy({
      owner: { id: account.id },
      name: name,
    });
  }

  /**
   * Returns the first audience belonging to the given account with
   * the sepcified 'id'. If not found, returns null
   *
   * @param account - The owner of the audience
   * @param id - ID used for lookup
   *
   */
  findOne(account: Account, id: string): Promise<Audience> {
    return this.audiencesRepository.findOneBy({
      owner: { id: account.id },
      id: id,
    });
  }

  /**
   * Add a new audience. Secondary (isPrimary=false) audiences cannot
   * have inclusion criteria or resources, and they cannot be dynamic.
   *
   * @remarks
   * If either the audience is not found or the template is not found
   * this function has no effect. If the template is already part of that audience
   * this function has no effect.
   *
   * @param account - The owner of the audience
   * @param updateAudienceDto - DTO with the updated information
   *
   */
  async insert(
    account: Account,
    createAudienceDto: CreateAudienceDto
  ): Promise<Audience> {
    const { name, isPrimary, description, templates, workflowId } =
      createAudienceDto;
    try {
      const resp = await this.audiencesRepository.save({
        customers: [],
        name,
        isPrimary,
        description,
        templates: await Promise.all(
          (templates || []).map((templateId) =>
            this.templatesService.templatesRepository.findOneBy({
              id: templateId,
            })
          )
        ),
        owner: { id: account.id },
        workflow: { id: workflowId },
      });
      return resp;
    } catch (e) {
      console.error(e);
    }
  }

  /**
   * Edit the description, name, resources, dynamicism, or inclusion criteria of
   * an audience
   *
   * @remarks
   * If either the audience is not found or the template is not found
   * this function has no effect. If the template is already part of that audience
   * this function has no effect.
   *
   * @param account - The owner of the audience
   * @param updateAudienceDto - DTO with the updated information
   *
   */
  async update(
    account: Account,
    updateAudienceDto: UpdateAudienceDto
  ): Promise<void> {
    let audience: Audience; // The found audience
    try {
      audience = await this.audiencesRepository.findOneBy({
        owner: { id: account.id },
        id: updateAudienceDto.id,
        isEditable: true,
      });

      // const workflows = await this.workflowRepository.find({
      //   where: {
      //     audiences: Like('%' + audience.id + '%'),
      //   },
      // });

      // if (workflows.some((wkf) => wkf.isActive)) {
      //   throw new HttpException('This workflow is active', 400);
      // }

      this.logger.debug('Found audience: ' + audience.id);
      if (!audience) {
        this.logger.error('Error: Audience not found');
        return Promise.reject(new Error(Errors.ERROR_DOES_NOT_EXIST));
      }
    } catch (err) {
      this.logger.error('Error: ' + err);
      return Promise.reject(err);
    }
    try {
      await this.audiencesRepository.update(
        { owner: { id: account.id }, id: updateAudienceDto.id },
        {
          description: updateAudienceDto.description,
          name: updateAudienceDto.name,
          resources: audience.isPrimary
            ? updateAudienceDto.resources
            : undefined,
        }
      );
      this.logger.debug('Updated audience: ' + audience.id);
    } catch (err) {
      this.logger.error('Error: ' + err);
      return Promise.reject(err);
    }
    return;
  }

  /**
   * Sets audience.isEditable to false.
   *
   * @remarks
   * Once an audience's isEditable field is set to false, only the customers
   * array of the audience entity can be modified, and only the moveCustomer
   * method can modify it. After freezing there is no way to thaw.
   *
   * @param account - The account entity that the audience belongs to
   * @param id - The audience ID to freeze
   *
   */
  async freeze(
    account: Account,
    id: string,
    queryRunner: QueryRunner
  ): Promise<Audience> {
    let found: Audience, ret: Audience;
    try {
      found = await queryRunner.manager.findOneBy(Audience, {
        owner: { id: account.id },
        id: id,
      });
      this.logger.debug('Found audience to freeze: ' + found.id);
    } catch (err) {
      this.logger.error('Error: ' + err);
      return Promise.reject(err);
    }
    try {
      ret = await queryRunner.manager.save(Audience, {
        ...found,
        isEditable: false,
      });
      this.logger.debug('Froze audience: ' + ret.id);
    } catch (err) {
      this.logger.error('Error: ' + err);
      return Promise.reject(err);
    }
    return ret;
  }

  /**
   * Moves a customer ID from one audience entity to another.
   *
   * @remarks
   * If either fromAud or toAud are falsy, this functions as a way
   * to remove/add customers from audiences. The audience must no longer
   * be editable. If the toAud is primary and static, the customer will
   * not be moved to that audience. If the toAud already contains that customerID,
   * the customer will not be moved into that audience. If the fromAud exists but 
   * does not contain that customer the customer will not be moved into
   * the toAud.
   *
   * @param fromAud - The audience entity to remove the customer ID from
   * @param toAud - The audience entity to add the customer ID to
   * @param customerId - The customer ID to add/remove
   *
   */
  async moveCustomer(
    account: Account,
    from: string | null | undefined,
    to: string | null | undefined,
    customer: CustomerDocument,
    event: EventDto,
    queryRunner: QueryRunner,
    encodedRules: string[],
    workflowID: string
  ): Promise<{ jobIds: (string | number)[]; templates: Template[] }> {

    // Base case: customer document must exist
    if (!customer || !customer.id) {
      this.logger.warn(`Warning: No customer to move from ${from} to ${to}`);
      return Promise.resolve({ jobIds: [], templates: [] });
    }

    const customerId = customer?.id;
    let index = -1; // Index of the customer ID in the fromAud.customers array
    const jobIds: (string | number)[] = [];
    let jobId: string | number;
    let fromAud: Audience, toAud: Audience;
    const templates: Template[] = [];
    try {
      if (from) {
        try {
          fromAud = await queryRunner.manager.findOneBy(Audience, {
            owner: { id: account.id },
            id: from,
          });
        } catch (err) {
          this.logger.error('Error: ' + err);
          return Promise.reject(err);
        }
      }

      if (to) {
        toAud = await queryRunner.manager.findOne(Audience, {
          where: { owner: { id: account.id }, id: to },
          relations: ['templates'],
        });
      }

      if (fromAud?.customers?.length) {
        index = fromAud?.customers?.indexOf(customerId);
        this.logger.debug(
          'Index of customer ' + customerId + ' inside of from: ' + index
        );
      }

      if (fromAud && !fromAud.isEditable) {
        if (index > -1) {
          this.logger.debug(
            'From customers before: ' + fromAud?.customers?.length
          );
          fromAud?.customers?.splice(index, 1);
          await queryRunner.manager.update(
            Audience,
            { id: fromAud.id, isEditable: false },
            {
              customers: fromAud?.customers,
            }
          );
          this.logger.debug(
            'From customers after: ' + fromAud?.customers?.length
          );
        }
        else {
          this.logger.warn(`Customer ${customerId} is not in ${from}, skipping`);
          return Promise.resolve({ jobIds: [], templates: [] });
        }
      }

      if (toAud && !toAud.isEditable) {
        this.logger.debug('To before: ' + toAud?.customers?.length);
        toAud.customers = [...toAud.customers, customerId];
        const saved = await queryRunner.manager.save(toAud);
        this.logger.debug('To after: ' + saved?.customers?.length);

        // Queue up any jobs for time based triggers based on this audience
        for (
          let rulesIndex = 0;
          rulesIndex < encodedRules?.length;
          rulesIndex++
        ) {
          const trigger = JSON.parse(
            Buffer.from(encodedRules[rulesIndex], 'base64').toString('ascii')
          );

          if (
            to == trigger?.source &&
            (trigger.properties.fromTime ||
              trigger.properties.toTime ||
              trigger.properties.specificTime ||
              trigger.properties.delayTime)
          ) {
            const type =
              trigger.properties.eventTime === 'SpecificTime'
                ? TimeJobType.SPECIFIC_TIME
                : trigger.properties.eventTime === 'Delay'
                  ? TimeJobType.DELAY
                  : TimeJobType.TIME_WINDOW;

            const now = DateTime.now();
            this.jobsService.create(account, {
              customer: customerId,
              from: trigger?.source,
              to: trigger?.dest[0],
              workflow: workflowID,
              startTime: trigger.properties.fromTime,
              endTime: trigger.properties.toTime,
              executionTime:
                trigger.properties.eventTime === 'SpecificTime'
                  ? trigger.properties.specificTime
                  : now.plus({
                    hours: trigger.properties.delayTime?.split(':')?.[0],
                    minutes: trigger.properties.delayTime?.split(':')?.[1],
                  }),
              type,
            });
          }
        }

        let toTemplates = toAud.templates.map((item) => item.id);

        if (
          account.emailProvider === 'free3' &&
          account.customerId !== customerId &&
          toTemplates.length
        ) {
          const data = await queryRunner.manager.find(Template, {
            where: {
              owner: { id: account.id },
              type: 'email',
              id: In(toTemplates),
            },
          });
          if (data.length > 0) {
            this.logger.debug(
              'ToAud templates before template skip: ',
              toTemplates
            );
            const dataIds = data.map((el2) => String(el2.id));
            toTemplates = toTemplates.filter(
              (el) => !dataIds.includes(String(el))
            );
            this.logger.debug(
              'ToAud templates after template skip: ',
              toTemplates
            );
            this.logger.warn(
              'Templates: [' +
              dataIds.join(',') +
              "] was skipped to send because test mail's can't be sent to external account."
            );
          }
        }

        if (toTemplates?.length) {
          for (
            let templateIndex = 0;
            templateIndex < toTemplates?.length;
            templateIndex++
          ) {
            jobId = await this.templatesService.queueMessage(
              account,
              toTemplates[templateIndex],
              customer,
              event,
              toAud.id
            );
            templates.push(
              await this.templatesService.templatesRepository.findOneBy({
                id: toTemplates[templateIndex],
              })
            );
            this.logger.debug('Queued Message');
            jobIds.push(jobId);
          }
        }
      }
    } catch (err) {
      this.logger.error('Error: ' + err);
      return Promise.reject(err);
    }

    return Promise.resolve({ jobIds, templates });
  }

  /**
   * Moves an array of customer documents from one audience to another.
   *
   * @remarks
   * Calls moveCustomer under the hood, this is just a convenience method
   *
   * @param fromAud - The audience entity to remove the customers from
   * @param toAud - The audience entity to add the customers to
   * @param customers - The array of customer documents to add/remove
   *
   */
  async moveCustomers(
    account: Account,
    fromAud: Audience | null | undefined,
    toAud: Audience | null | undefined,
    customers: CustomerDocument[],
    event: EventDto,
    queryRunner: QueryRunner,
    encodedRules: string[],
    workflowId: string
  ): Promise<(string | number)[]> {
    let jobIds: (string | number)[] = [];
    for (let index = 0; index < customers?.length; index++) {
      try {
        const { jobIds: jobIdArr } = await this.moveCustomer(
          account,
          fromAud?.id,
          toAud?.id,
          customers[index],
          event,
          queryRunner,
          encodedRules,
          workflowId
        );
        jobIds = [...jobIdArr, ...jobIds];
      } catch (err) {
        this.logger.error('Error: ' + err);
        return Promise.reject(err);
      }
    }
    // TODO: remove
    console.warn("jobId's ==============\n", jobIds);
    return Promise.resolve(jobIds);
  }
}
