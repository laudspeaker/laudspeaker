import {
  HttpException,
  Inject,
  Injectable,
  LoggerService,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Like, Repository } from 'typeorm';
import { Audience } from './entities/audience.entity';
import { CreateAudienceDto } from './dto/create-audience.dto';
import { UpdateAudienceDto } from './dto/update-audience.dto';
import { Account } from '../accounts/entities/accounts.entity';
import { AddTemplateDto } from './dto/add-template.dto';
import { CustomerDocument } from '../customers/schemas/customer.schema';
import { Template } from '../templates/entities/template.entity';
import Errors from '../../shared/utils/errors';
import { TemplatesService } from '../templates/templates.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { from } from 'form-data';
import { Job } from 'bull';
import { CustomersService } from '../customers/customers.service';
import { checkInclusion } from './audiences.helper';
import { Stats } from './entities/stats.entity';
import { Workflow } from '../workflows/entities/workflow.entity';
import { EventDto } from '../events/dto/event.dto';

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
    private audiencesRepository: Repository<Audience>,
    @InjectRepository(Stats) private statsRepository: Repository<Stats>,
    @InjectRepository(Workflow)
    private workflowRepository: Repository<Workflow>,
    @Inject(TemplatesService) private templatesService: TemplatesService
  ) {}

  /**
   * Find all audiences that belong to a given account. If
   * not found, returns empty array
   *
   * @param account - The owner of the audiences
   *
   */
  findAll(account: Account): Promise<Audience[]> {
    return this.audiencesRepository.findBy({ ownerId: (<Account>account).id });
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
      ownerId: (<Account>account).id,
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
      ownerId: (<Account>account).id,
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
    const audience = new Audience();
    audience.name = createAudienceDto.name;
    audience.customers = [];
    audience.templates = [];
    audience.isDynamic = createAudienceDto.isPrimary
      ? createAudienceDto.isDynamic
      : false;
    audience.isPrimary = createAudienceDto.isPrimary;
    audience.inclusionCriteria = createAudienceDto.isPrimary
      ? createAudienceDto.inclusionCriteria
      : undefined;
    audience.description = createAudienceDto.description;
    audience.ownerId = account.id;
    try {
      const resp = await this.audiencesRepository.save(audience);
      const stats = this.statsRepository.create({ audience: resp });
      await this.statsRepository.save(stats);
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
        ownerId: (<Account>account).id,
        id: updateAudienceDto.id,
        isEditable: true,
      });

      const workflows = await this.workflowRepository.find({
        where: {
          audiences: Like('%' + audience.id + '%'),
        },
      });

      if (workflows.some((wkf) => wkf.isActive)) {
        throw new HttpException('This workflow is active', 400);
      }

      this.logger.debug('Found audience: ' + audience);
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
        { ownerId: (<Account>account).id, id: updateAudienceDto.id },
        {
          description: updateAudienceDto.description,
          name: updateAudienceDto.name,
          isDynamic: audience.isPrimary ? updateAudienceDto.isDynamic : false,
          resources: audience.isPrimary
            ? updateAudienceDto.resources
            : undefined,
          inclusionCriteria: audience.isPrimary
            ? updateAudienceDto.inclusionCriteria
            : undefined,
        }
      );
      this.logger.debug('Updated audience: ' + audience);
    } catch (err) {
      this.logger.error('Error: ' + err);
      return Promise.reject(err);
    }
    return;
  }

  /**
   * Add a message template to an audience.
   *
   * @remarks
   * If either the audience is not found or the template is not found
   * this function has no effect. If the template is already part of that audience
   * this function has no effect.
   *
   * @param account - The owner of the audience and the template
   * @param addTemplateDto - DTO with the audienceId and templateId
   *
   */
  async addTemplate(
    account: Account,
    addTemplateDto: AddTemplateDto
  ): Promise<void> {
    let audience: Audience, // Audience to add template to
      template: Template; // Template to add to audience
    try {
      audience = await this.audiencesRepository.findOneBy({
        ownerId: (<Account>account).id,
        id: addTemplateDto.audienceId,
        isEditable: true,
      });
      this.logger.debug('Found audience: ' + audience);
    } catch (err: unknown) {
      this.logger.error('Error: ' + err);
      return Promise.reject(<Error>err);
    }
    try {
      template = await this.templatesService.findOneById(
        account,
        addTemplateDto.templateId
      );
      this.logger.debug('Found template: ' + template);
    } catch (err: unknown) {
      this.logger.error('Error: ' + err);
      return Promise.reject(<Error>err);
    }
    if (audience && template) {
      if (
        audience.templates.length &&
        audience.templates.indexOf(template.id) > -1
      ) {
        this.logger.debug('Template already exists on audience');
        return Promise.resolve();
      }
      const temp = [addTemplateDto.templateId];
      const templates = temp.concat(audience.templates);
      try {
        await this.audiencesRepository.update(
          { ownerId: (<Account>account).id, id: addTemplateDto.audienceId },
          {
            templates: templates,
          }
        );
        this.logger.debug('Added template to audience.');
      } catch (err: unknown) {
        this.logger.error('Error: ' + err);
        return Promise.reject(<Error>err);
      }
    } else {
      this.logger.error('Error: Template or audience does not exist');
      return Promise.reject(new Error(Errors.ERROR_DOES_NOT_EXIST));
    }
  }

  /**
   * Find all dynamic audiences
   *
   * @param account - The account entity that the audiences belongs to
   *
   */

  findAllDynamic(account: Account): Promise<Audience[]> {
    return this.audiencesRepository.findBy({
      ownerId: (<Account>account).id,
      isDynamic: true,
      isPrimary: true,
    });
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
  async freeze(account: Account, id: string): Promise<Audience> {
    let found: Audience, ret: Audience;
    try {
      found = await this.audiencesRepository.findOneBy({
        ownerId: (<Account>account).id,
        id: id,
      });
      this.logger.debug('Found audience to freeze: ' + found);
    } catch (err) {
      this.logger.error('Error: ' + err);
      return Promise.reject(err);
    }
    try {
      ret = await this.audiencesRepository.save({
        ...found,
        isEditable: false,
      });
      this.logger.debug('Froze audience: ' + ret);
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
   * not be moved to that audience.
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
    customerId: string,
    event: EventDto
  ): Promise<Job<any>> {
    let index = -1; // Index of the customer ID in the fromAud.customers array
    let jobId: Job<any>;
    let fromAud, toAud: Audience;
    if (from) {
      try {
        fromAud = await this.findOne(account, from);
        //this.logger.debug('Audience: ' + fromAud);
      } catch (err) {
        this.logger.error('Error: ' + err);
        return Promise.reject(err);
      }
    }
    if (to) {
      try {
        toAud = await this.findOne(account, to);
        //this.logger.debug('Audience: ' + toAud);
      } catch (err) {
        this.logger.error('Error: ' + err);
        return Promise.reject(err);
      }
    }
    if (fromAud?.customers?.length) {
      index = fromAud?.customers.indexOf(customerId);
      this.logger.debug(
        'Index of customer ' + customerId + ' inside of from: ' + index
      );
    }
    if (fromAud && !fromAud.isEditable && index > -1) {
      try {
        this.logger.debug('From customers before: ' + fromAud.customers.length);
        fromAud.customers.splice(index, 1);
        await this.audiencesRepository.update(
          { id: fromAud.id, isEditable: false },
          {
            customers: fromAud.customers,
          }
        );
        this.logger.debug('From customers after: ' + fromAud.customers.length);
      } catch (err) {
        this.logger.error('Error: ' + err);
        return Promise.reject(err);
      }
    }
    if (toAud && !toAud.isEditable) {
      try {
        this.logger.debug('To before: ' + toAud.customers.length);
        const saved = await this.audiencesRepository.save(
          //{ id: toAud.id, isEditable: false },
          {
            ...toAud,
            customers: [...toAud.customers, customerId],
          }
        );
        this.logger.debug('To after: ' + saved.customers.length);
      } catch (err) {
        this.logger.error('Error: ' + err);
        return Promise.reject(err);
      }
      if (toAud.templates?.length) {
        for (
          let templateIndex = 0;
          templateIndex < toAud.templates.length;
          templateIndex++
        ) {
          try {
            console.log("ya ya 2");
            jobId = await this.templatesService.queueMessage(
              account,
              toAud.templates[templateIndex],
              customerId,
              event
            );
            this.logger.debug('Queued Message');
          } catch (err) {
            this.logger.error('Error: ' + err);
            return Promise.reject(err);
          }
        }
      }
    }
    return Promise.resolve(jobId);
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
    event: EventDto
  ): Promise<void> {
    for (let index = 0; index < customers.length; index++) {
      try {
        await this.moveCustomer(
          account,
          fromAud?.id,
          toAud?.id,
          customers[index].id,
          event
        );
      } catch (err) {
        this.logger.error('Error: ' + err);
        return Promise.reject(err);
      }
    }
  }
}
