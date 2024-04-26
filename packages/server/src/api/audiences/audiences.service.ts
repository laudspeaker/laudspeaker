import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryRunner, Repository } from 'typeorm';
import { Audience } from './entities/audience.entity';
import { CreateAudienceDto } from './dto/create-audience.dto';
import { UpdateAudienceDto } from './dto/update-audience.dto';
import { Account } from '../accounts/entities/accounts.entity';
import { CustomerDocument } from '../customers/schemas/customer.schema';
import { Template, TemplateType } from '../templates/entities/template.entity';
import Errors from '../../shared/utils/errors';
import { TemplatesService } from '../templates/templates.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Workflow } from '../workflows/entities/workflow.entity';
import { EventDto } from '../events/dto/event.dto';
import { JobsService } from '../jobs/jobs.service';
import { DateTime } from 'luxon';
import { TimeJobType } from '../jobs/entities/job.entity';
import { InclusionCriteria } from '../segments/types/segment.type';
import { Workspace } from '../workspaces/entities/workspace.entity';

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
  ) {}

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: AudiencesService.name,
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
        class: AudiencesService.name,
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
        class: AudiencesService.name,
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
        class: AudiencesService.name,
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
        class: AudiencesService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  /**
   * Find all audiences that belong to a given account. If
   * not found, returns empty array
   *
   * @param account - The owner of the audiences
   *
   */
  async findAll(account: Account, session: string): Promise<Audience[]> {
    try {
      this.debug(
        `Finding all audiences`,
        this.findByName.name,
        session,
        account.id
      );

      const audiences = await this.audiencesRepository.findBy({
        owner: { id: account.id },
      });

      this.debug(
        `Found audiences: ${JSON.stringify(audiences)}`,
        this.findAll.name,
        session,
        account.id
      );
      return audiences;
    } catch (e) {
      this.error(e, this.findAll.name, session, account.id);
      throw e;
    }
  }

  /**
   * Returns the first audience belonging to the given account with
   * the sepcified 'name' field. If not found, returns null
   *
   * @param account - The owner of the audience
   * @param name - name used for lookup
   *
   */
  async findByName(
    account: Account,
    name: string,
    session: string
  ): Promise<Audience | null> {
    try {
      this.debug(
        `Finding audience: ${JSON.stringify({ name: name })}`,
        this.findByName.name,
        session,
        account.id
      );
      const audience = await this.audiencesRepository.findOneBy({
        owner: { id: account.id },
        name: name,
      });

      this.debug(
        `Found audience: ${JSON.stringify(audience)}`,
        this.findByName.name,
        session,
        account.id
      );
      return audience;
    } catch (e) {
      this.error(e, this.findByName.name, session, account.id);
      throw e;
    }
  }

  /**
   * Returns the first audience belonging to the given account with
   * the sepcified 'id'. If not found, returns null
   *
   * @param account - The owner of the audience
   * @param id - ID used for lookup
   *
   */
  async findOne(
    account: Account,
    id: string,
    session: string
  ): Promise<Audience> {
    try {
      this.debug(
        `Finding audience: ${JSON.stringify({ id: id })}`,
        this.findOne.name,
        session,
        account.id
      );
      const audience = await this.audiencesRepository.findOneBy({
        owner: { id: account.id },
        id: id,
      });
      this.debug(
        `Found audience: ${JSON.stringify(audience)}`,
        this.findOne.name,
        session,
        account.id
      );
      return audience;
    } catch (e) {
      this.error(e, this.findOne.name, session, account.id);
      throw e;
    }
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
    createAudienceDto: CreateAudienceDto,
    session: string
  ): Promise<Audience> {
    try {
      this.debug(
        `Creating audience: ${JSON.stringify(createAudienceDto)}`,
        this.insert.name,
        session,
        account.id
      );
      const { name, isPrimary, description, templates, workflowId } =
        createAudienceDto;
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
      this.debug(
        `Created audience: ${JSON.stringify(resp)}`,
        this.insert.name,
        session,
        account.id
      );
      return resp;
    } catch (e) {
      this.error(e, this.insert.name, session, account.id);
      throw e;
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
    updateAudienceDto: UpdateAudienceDto,
    session: string
  ): Promise<void> {
    let audience: Audience; // The found audience
    try {
      this.debug(
        `Updating audience ${JSON.stringify({
          id: audience?.id,
        })} with ${JSON.stringify(updateAudienceDto)}`,
        this.update.name,
        session,
        account.id
      );

      audience = await this.audiencesRepository.findOneBy({
        owner: { id: account.id },
        id: updateAudienceDto.id,
        isEditable: true,
      });
      if (!audience) {
        throw new Error(Errors.ERROR_DOES_NOT_EXIST);
      }
      this.debug(
        `Found audience to update: ${JSON.stringify({ id: audience?.id })}`,
        this.update.name,
        session,
        account.id
      );

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
      this.debug(
        `Updated audience ${JSON.stringify({
          id: audience?.id,
        })} with ${JSON.stringify(updateAudienceDto)}`,
        this.update.name,
        session,
        account.id
      );
    } catch (e) {
      this.error(e, this.update.name, session, account.id);
      throw e;
    }
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
    queryRunner: QueryRunner,
    session: string
  ): Promise<Audience> {
    let found: Audience, ret: Audience;
    try {
      this.debug(
        `Freezing audience: ${JSON.stringify({ id: id })}`,
        this.freeze.name,
        session,
        account.id
      );
      found = await queryRunner.manager.findOneBy(Audience, {
        owner: { id: account.id },
        id: id,
      });
      this.debug(
        `Found audience to freeze: ${JSON.stringify({ id: found?.id })}`,
        this.freeze.name,
        session,
        account.id
      );
      ret = await queryRunner.manager.save(Audience, {
        ...found,
        isEditable: false,
      });
      this.debug(
        `Froze audience: ${JSON.stringify({ id: found?.id })}`,
        this.freeze.name,
        session,
        account.id
      );
      return ret;
    } catch (err) {
      this.error(err, this.freeze.name, session, account.id);
      throw err;
    }
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
    workspace: Workspace,
    from: string | null | undefined,
    to: string | null | undefined,
    customer: CustomerDocument,
    event: EventDto,
    queryRunner: QueryRunner,
    encodedRules: string[],
    workflowID: string,
    session: string
  ): Promise<{
    jobIds: (string | number)[];
    templates: Template[];
  }> {
    // Base case: customer document must exist
    if (!customer || !customer.id) {
      this.warn(
        `Warning: No customer to move from ${from} to ${to}`,
        this.moveCustomer.name,
        session,
        account.id
      );
      return Promise.resolve({ jobIds: [], templates: [] });
    }

    const customerId = customer?.id;
    let index = -1; // Index of the customer ID in the fromAud.customers array
    const jobIds: (string | number)[] = [];
    let jobId: string | number;
    let fromAud: Audience, toAud: Audience;
    const templates: Template[] = [];
    try {
      this.debug(
        `Moving customer ${JSON.stringify({
          from: from,
          to: to,
          id: customer?.id,
        })}`,
        this.moveCustomer.name,
        session,
        account.id
      );
      if (from) {
        fromAud = await queryRunner.manager.findOneBy(Audience, {
          owner: { id: account.id },
          id: from,
        });
      }
      this.debug(
        `Found source audience: ${JSON.stringify(fromAud)}`,
        this.moveCustomer.name,
        session,
        account.id
      );

      if (to) {
        toAud = await queryRunner.manager.findOne(Audience, {
          where: { owner: { id: account.id }, id: to },
          relations: ['templates'],
        });
      }
      this.debug(
        `Found destination audience: ${JSON.stringify(toAud)}`,
        this.moveCustomer.name,
        session,
        account.id
      );

      if (fromAud?.customers?.length) {
        index = fromAud?.customers?.indexOf(customerId);
        this.debug(
          `Source Audience customer index: ${JSON.stringify({
            audience: from,
            customer: customerId,
            index: index,
          })}`,
          this.moveCustomer.name,
          session,
          account.id
        );
      }

      if (fromAud && !fromAud.isEditable) {
        if (index > -1) {
          this.debug(
            `Source audience customer list length before move: ${JSON.stringify(
              { length: fromAud?.customers?.length }
            )}`,
            this.moveCustomer.name,
            session,
            account.id
          );
          fromAud?.customers?.splice(index, 1);
          await queryRunner.manager.update(
            Audience,
            { id: fromAud.id, isEditable: false },
            {
              customers: fromAud?.customers,
            }
          );
          this.debug(
            `Source audience customer list length after move: ${JSON.stringify({
              length: fromAud?.customers?.length,
            })}`,
            this.moveCustomer.name,
            session,
            account.id
          );
        } else {
          this.warn(
            `Customer not in source audience, skipping: ${JSON.stringify({
              customer: customerId,
              audience: from,
            })}`,
            this.moveCustomer.name,
            session,
            account.id
          );
          return Promise.resolve({ jobIds: [], templates: [] });
        }
      }

      if (toAud && !toAud.isEditable && !toAud.customers.includes(customerId)) {
        this.debug(
          `Destination audience customer list length before move: ${JSON.stringify(
            { length: toAud?.customers?.length }
          )}`,
          this.moveCustomer.name,
          session,
          account.id
        );
        toAud.customers = [...toAud.customers, customerId];
        const saved = await queryRunner.manager.save(toAud);
        this.debug(
          `Destination audience customer list length after move: ${JSON.stringify(
            { length: saved?.customers?.length }
          )}`,
          this.moveCustomer.name,
          session,
          account.id
        );

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

            this.debug(
              `Queuing time delay message: ${JSON.stringify({
                recepient: customer.id,
                from: trigger?.source,
                to: trigger?.dest,
              })}`,
              this.moveCustomer.name,
              session,
              account.id
            );

            const now = DateTime.now();
            this.jobsService.create(
              account,
              {
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
              },
              session
            );
            this.debug(
              `Queued time delay message: ${JSON.stringify({
                recepient: customer.id,
                from: trigger?.source,
                to: trigger?.dest,
              })}`,
              this.moveCustomer.name,
              session,
              account.id
            );
          }
        }

        let toTemplates = toAud.templates.map((item) => item.id);

        if (workspace?.emailProvider === 'free3' && toTemplates.length) {
          const data = await queryRunner.manager.find(Template, {
            where: {
              workspace: {
                id: workspace.id,
              },
              type: TemplateType.EMAIL,
              id: In(toTemplates),
            },
          });
          if (data.length > 0) {
            const dataIds = data.map((el2) => String(el2.id));
            toTemplates = toTemplates.filter(
              (el) => !dataIds.includes(String(el))
            );
            this.warn(
              `Skipping sending templates to unverified customer using free3: ${JSON.stringify(
                { customer: customer.id, templates: dataIds.join(',') }
              )}`,
              this.moveCustomer.name,
              session,
              account.id
            );
          }
        }

        if (toTemplates?.length) {
          for (
            let templateIndex = 0;
            templateIndex < toTemplates?.length;
            templateIndex++
          ) {
            this.debug(
              `Queuing message: ${JSON.stringify({
                recepient: customer.id,
                template: toTemplates[templateIndex],
              })}`,
              this.moveCustomer.name,
              session,
              account.id
            );
            jobId = await this.templatesService.queueMessage(
              account,
              workspace,
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
            jobIds.push(jobId);
            this.debug(
              `Queued message: ${JSON.stringify({
                recepient: customer.id,
                template: toTemplates[templateIndex],
              })}`,
              this.moveCustomer.name,
              session,
              account.id
            );
          }
        }
      }
    } catch (err) {
      this.error(err, this.moveCustomer.name, session, account.id);
      throw err;
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
    workspace: Workspace,
    fromAud: Audience | null | undefined,
    toAud: Audience | null | undefined,
    customers: CustomerDocument[],
    event: EventDto,
    queryRunner: QueryRunner,
    encodedRules: string[],
    workflowId: string,
    session: string
  ): Promise<(string | number)[]> {
    let jobIds: (string | number)[] = [];
    for (let index = 0; index < customers?.length; index++) {
      try {
        this.debug(
          `Moving customers ${JSON.stringify({ customers: customers })}`,
          this.moveCustomers.name,
          session,
          account.id
        );

        const { jobIds: jobIdArr } = await this.moveCustomer(
          account,
          workspace,
          fromAud?.id,
          toAud?.id,
          customers[index],
          event,
          queryRunner,
          encodedRules,
          workflowId,
          session
        );
        this.debug(
          `Moved customers ${JSON.stringify({ customers: customers })}`,
          this.moveCustomers.name,
          session,
          account.id
        );

        jobIds = [...jobIdArr, ...jobIds];
      } catch (err) {
        this.error(err, this.moveCustomers.name, session, account.id);
        throw err;
      }
    }
    return Promise.resolve(jobIds);
  }

  public async getFilter(
    account: Account,
    id: string,
    session: string
  ): Promise<InclusionCriteria | null> {
    try {
      this.debug(
        `Finding filters for ${JSON.stringify({ id: id })}`,
        this.getFilter.name,
        session,
        account.id
      );
      const res = await this.audiencesRepository.query(
        'SELECT filter."inclusionCriteria" FROM audience LEFT JOIN workflow ON workflow.id = audience."workflowId" LEFT JOIN filter ON filter.id = workflow."filterId" WHERE audience.id = $1 AND audience."ownerId" = $2 LIMIT 1;',
        [id, account.id]
      );
      this.debug(
        `Found filters for ${JSON.stringify({ id: id, res: res })}`,
        this.getFilter.name,
        session,
        account.id
      );

      return res?.[0]?.inclusionCriteria || null;
    } catch (e) {
      this.error(e, this.getFilter.name, session, account.id);
      throw e;
    }
  }
}
