/* eslint-disable no-case-declarations */
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
} from '@nestjs/common';
import { Customer } from './entities/customer.entity';
import mockData from '../../fixtures/mockData';
import { Account } from '../accounts/entities/accounts.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, In, QueryRunner, Repository, Brackets, ArrayContains } from 'typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { attributeConditions } from '../../fixtures/attributeConditions';
import { isEmail } from 'class-validator';
import { parse } from 'csv-parse';
import * as datefns from 'date-fns';
import { SegmentsService } from '../segments/segments.service';
import { SegmentCustomers } from '../segments/entities/segment-customers.entity';
import { EventsService } from '../events/events.service';
import * as _ from 'lodash';
import { StepsService } from '../steps/steps.service';
import { S3Service } from '../s3/s3.service';
import { Imports } from './entities/imports.entity';
import { ImportCustomersDTO, MappingParam } from './dto/import-customers.dto';
import * as fastcsv from 'fast-csv';
import * as fs from 'fs';
import path from 'path';
import { isValid } from 'date-fns';
import { JourneyLocationsService } from '../journeys/journey-locations.service';
import { Journey } from '../journeys/entities/journey.entity';
import { SegmentType } from '../segments/entities/segment.entity';
import { StepType } from '../steps/types/step.interface';
import {
  KEYS_TO_SKIP,
} from '../../utils/customer-key-name-validator';
import { UpsertCustomerDto } from './dto/upsert-customer.dto';
import { Workspaces } from '../workspaces/entities/workspaces.entity';
import { parseISO, add, sub, formatISO } from 'date-fns';
import { cloneDeep } from 'lodash';
import { StatementValueType } from '../journeys/types/visual-layout.interface';
import { uuidv7 } from "uuidv7";
import { Organization } from '../organizations/entities/organization.entity';
import * as Sentry from '@sentry/node';
import { CacheService } from '../../common/services/cache.service';

import { CustomerSearchOptions } from './interfaces/CustomerSearchOptions.interface';
import { CustomerSearchOptionResult } from './interfaces/CustomerSearchOptionResult.interface';
import { FindType } from './enums/FindType.enum';
import { QueueType } from '../../common/services/queue/types/queue-type';
import { Producer } from '../../common/services/queue/classes/producer';
import {
  ClickHouseTable,
  ClickHouseClient,
  ClickHouseRow
} from '../../common/services/clickhouse';
import { StepsHelper } from '../steps/steps.helper';
import { AttributeTypeName } from './entities/attribute-type.entity';
import { CustomerKeysService } from './customer-keys.service';
import { CustomerKey } from './entities/customer-keys.entity';
import { CacheConstants } from '../../common/services/cache.constants';
import { Query } from '../../common/services/query';
import { SegmentCustomersService } from '../segments/segment-customers.service';

export type Correlation = {
  cust: Customer;
  found: boolean;
};

const eventsMap = {
  sent: 'sent',
  clicked: 'clicked',
  delivered: 'delivered',
  opened: 'opened',
};

// Keeping these together so they stay in sync as we
// add more channels.

const rules = {
  email: ['^email', '^email_address'],
  phone: ['^phone', '^phone_number'],
  ios: ['^iosDeviceToken'],
  android: ['^androidDeviceToken'],
};

const rulesRaw = {
  email: ['email', 'email_address'],
  phone: ['phone', 'phone_number'],
  ios: ['iosDeviceToken'],
  android: ['androidDeviceToken'],
};

export interface JourneyDataForTimeLine {
  id: string;
  name: string;
  isFinished: boolean | null;
  currentStepId: string | null;
  enrollmentTime: Date | null;
}

export interface EventResponse {
  event: string;
  stepId: string;
  createdAt: string;
  templateId: string;
  journeyName: string;
  templateName: string;
  templateType: string;
  eventProvider: string;
}

export interface QueryObject {
  type: string;
  key: string;
  comparisonType: string;
  subComparisonType: string;
  subComparisonValue: string;
  valueType: string;
  value: any;
}

const acceptableBooleanConvertable = {
  true: ['TRUE', 'true', 'T', 't', 'yes', '1'],
  false: ['FALSE', 'false', 'F', 'f', 'no', '0'],
};

export interface SystemAttribute {
  id: string;
  key: string;
  type: string;
  is_primary?: string;
  dateFormat?: string;
  isArray: boolean;
  isSystem: true;
}

export interface QueryOptions {
  // ... other properties ...
  customerKeys?: { key: string; type: AttributeTypeName }[];
}

@Injectable()
export class CustomersService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    private dataSource: DataSource,
    private segmentsService: SegmentsService,
    @InjectRepository(Account)
    public accountsRepository: Repository<Account>,
    @InjectRepository(Customer)
    public customersRepository: Repository<Customer>,
    @InjectRepository(Imports)
    public importsRepository: Repository<Imports>,
    private readonly stepsHelper: StepsHelper,
    @Inject(StepsService)
    private readonly stepsService: StepsService,
    @Inject(EventsService)
    private readonly eventsService: EventsService,
    @Inject(CustomerKeysService)
    private readonly customerKeysService: CustomerKeysService,
    private readonly s3Service: S3Service,
    @Inject(JourneyLocationsService)
    private readonly journeyLocationsService: JourneyLocationsService,
    @Inject(CacheService) private cacheService: CacheService,
    @Inject(ClickHouseClient)
    private clickhouseClient: ClickHouseClient,
    @Inject(SegmentCustomersService)
    private segmentCustomersService: SegmentCustomersService
  ) { }

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: CustomersService.name,
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
        class: CustomersService.name,
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
        class: CustomersService.name,
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
        class: CustomersService.name,
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
        class: CustomersService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  async checkCustomerLimit(organization: Organization, customersToAdd = 1) {
    this.debug(
      `in checkCustomerLimte`,
      this.checkCustomerLimit.name,
      'session'
    );

    const customersInOrganization = await this.customersRepository.count({
      where: {
        workspace: In(organization.workspaces.map((workspace) => workspace.id))
      }
    });

    if (
      process.env.NODE_ENV !== 'development' &&
      organization.plan.customerLimit != -1
    ) {
      if (
        customersInOrganization + customersToAdd >
        organization.plan.customerLimit
      ) {
        throw new HttpException(
          'Customers limit has been exceeded',
          HttpStatus.PAYMENT_REQUIRED
        );
      }
    }

    return customersInOrganization;
  }

  async create(
    account: Account,
    createCustomerDto: any,
    session: string,
  ): Promise<Customer> {
    const organization = account?.teams?.[0]?.organization;
    const workspace = organization?.workspaces?.[0];

    await this.checkCustomerLimit(organization);

    const createdCustomer = new Customer();
    createdCustomer.uuid = uuidv7();
    createdCustomer.workspace = workspace;
    createdCustomer.created_at = new Date();
    createdCustomer.updated_at = new Date();
    createdCustomer.user_attributes = { ...createCustomerDto };

    return await this.customersRepository.save(createdCustomer);
  }


  async createAnonymous(
    account: Account,
  ): Promise<Customer> {
    const organization = account?.teams?.[0]?.organization;
    const workspace = organization?.workspaces?.[0];

    await this.checkCustomerLimit(organization);

    const createdCustomer = new Customer();
    createdCustomer.uuid = uuidv7();
    createdCustomer.workspace = workspace;
    createdCustomer.created_at = new Date();
    createdCustomer.updated_at = new Date();
    createdCustomer.system_attributes.is_anonymous = true;

    return await this.customersRepository.save(createdCustomer);
  }

  async getFieldType(key: string, workspaceId: string, session: string): Promise<string | null> {
    const customerKey = await this.customerKeysService.getKeyByName(key, workspaceId, session);

    // If the customerKey is found, return its type; otherwise, return null
    return customerKey ? customerKey.attribute_type.name : null;
  }

  async findAll(
    account: Account,
    session: string,
    take = 100,
    skip = 0,
    key = '',
    search = '',
    showFreezed = false,
    createdAtSortType: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: Customer[]; totalPages: number }> {
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    const totalCustomers = await this.customersRepository.count({
      where: {
        workspace: { id: workspace.id },
      },
    });

    const totalPages = Math.ceil(totalCustomers / take) || 1;

    const fieldType = await this.getFieldType(key, workspace.id, session);

    let queryCondition = { workspace: { id: workspace.id } };
    switch (fieldType) {
      case 'String':
        queryCondition[key] = new RegExp(`.*${search}.*`, 'i');
        break;
      case 'Email':
        queryCondition[key] = new RegExp(`.*${search}.*`, 'i');
        break;
      case 'Number':
        // Convert search to a number and search for equality (you can extend this to range queries)
        const searchNumber = Number(search);
        if (!isNaN(searchNumber)) {
          queryCondition[key] = searchNumber;
        }
        break;
      case 'Boolean':
        // Convert search to a boolean
        queryCondition[key] = search === 'true';
        break;
      // Handle other types as needed
      default:
        break;
    }

    const customers = await this.customersRepository.find({
      where: queryCondition,
      skip,
      take: Math.min(take, 100),
      order: {
        created_at: createdAtSortType,
      },
    });
    return { data: customers, totalPages };
  }

  async findOne(account: Account, id: string, session: string) {
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    const customer = await this.customersRepository.findOne({
      where: {
        id,
        workspace: { id: workspace.id },
      }
    });
    if (!customer) {
      throw new HttpException('Person not found', HttpStatus.NOT_FOUND);
    }

    return customer;
  }

  async findOneByUUID(account: Account, uuid: string, session: string) {
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    const customer = await this.customersRepository.findOne({
      where: [{
        workspace: { id: workspace.id },
        uuid: uuid,
      }, {
        workspace: { id: workspace.id },
        other_ids: ArrayContains([uuid]),
      }],
      relations: ['workspace']
    });
    if (!customer) {
      throw new HttpException('Person not found', HttpStatus.NOT_FOUND);
    }

    return customer;
  }

  async findCustomerEvents(
    account: Account,
    customerId: string,
    session: string,
    page = 1,
    pageSize = 10
  ) {
    const offset = (page - 1) * pageSize;

    const countResponse = await this.clickhouseClient.query({
      query: `SELECT count() as totalCount FROM ${ClickHouseTable.MESSAGE_STATUS} WHERE customerId = {customerId:String}`,
      query_params: { customerId },
    });

    const totalCount =
      (await countResponse.json<{ totalCount: number }>()).data[0]
        ?.totalCount || 0;
    const totalPage = Math.ceil(totalCount / pageSize);

    const response = await this.clickhouseClient.query({
      query: `
        SELECT stepId, event, createdAt, eventProvider, templateId 
        FROM ${ClickHouseTable.MESSAGE_STATUS} 
        WHERE customerId = {customerId:String} 
        ORDER BY createdAt DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `,
      query_params: { customerId },
    });

    const data = (
      await response.json<{
        audienceId: string;
        event: string;
        createdAt: string;
      }>()
    )?.data;

    const updatedData: { ch: EventResponse }[] = await this.dataSource.query(
      `
        SELECT 
          ch::jsonb 
          || jsonb_build_object('templateName', tp.name)
          || jsonb_build_object('templateType', tp.type)
          || jsonb_build_object('journeyName', jr.name) as ch
        FROM unnest($1::jsonb[]) as ch_data(ch)
        LEFT JOIN "template" as tp ON tp.id = (ch::json->>'templateId')::int
        LEFT JOIN "step" ON step.id = (ch::json->>'stepId')::uuid
        LEFT JOIN "journey" as jr ON jr.id = step."journeyId"
        ORDER BY (ch::json->>'createdAt')::timestamp DESC;
      `,
      [data]
    );
    const result = updatedData.map((el) => el.ch);

    return {
      data: result,
      page,
      pageSize,
      totalPage,
      totalCount,
    };
  }

  addPrefixToKeys(
    obj: Record<string, any>,
    prefix: string
  ): Record<string, any> {
    const newObj: Record<string, any> = {};

    for (const [key, value] of Object.entries(obj)) {
      newObj[`${prefix}${key}`] = value;
    }

    return newObj;
  }

  filterFalsyAndDuplicates<T>(arr: T[]): T[] {
    return Array.from(new Set(arr.filter(Boolean)));
  }

  async update(
    account: Account,
    id: string,
    updateCustomerDto: Record<string, unknown>,
    session: string
  ) {
    const { ...newCustomerData } = updateCustomerDto;

    KEYS_TO_SKIP.forEach((el) => {
      delete newCustomerData[el];
    });

    const customer = await this.findOne(account, id, session);
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    if (customer.workspace.id != workspace.id) {
      throw new HttpException("You can't update this customer.", 400);
    }

    const newCustomer = {
      ...customer,
      ...newCustomerData,
    };

    const replacementRes = await this.customersRepository.update(id,
      newCustomer
    );

    return replacementRes;
  }

  async updateByUUID(
    account: Account,
    uuid: string,
    updateCustomerDto: Record<string, unknown>,
    session: string
  ) {
    const { ...newCustomerData } = updateCustomerDto;

    KEYS_TO_SKIP.forEach((el) => {
      delete newCustomerData[el];
    });

    const customer = await this.findOneByUUID(account, uuid, session);
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    if (customer.workspace.id != workspace.id) {
      throw new HttpException("You can't update this customer.", 400);
    }

    const newCustomer = {
      ...customer,
      ...newCustomerData,
    };

    const replacementRes = await this.customersRepository.update({ uuid },
      newCustomer
    );

    return replacementRes;
  }

  async updateCustomer(
    account: Account,
    customerId: string,
    fieldName: keyof Customer,
    newValue: any,
    session: string,
    queryRunner?: QueryRunner
  ): Promise<Customer> {
    if (queryRunner) {
      const customer = await queryRunner.manager.findOne(Customer, {
        where: {
          id: customerId,
          workspace: { id: account?.teams?.[0]?.organization?.workspaces?.[0].id }
        }
      });
      if (!customer) {
        throw new Error(`Customer with ID ${customerId} not found`);
      }
      if (Array.isArray(customer[fieldName])) {
        (customer[fieldName] as any) = [ ...customer[fieldName], ...newValue ];
      }
      else if (typeof customer[fieldName] === 'object' && customer[fieldName] !== null) {
        (customer[fieldName] as any) = { ...customer[fieldName], ...newValue };
      } else {
        (customer as any)[fieldName] = newValue;
      }
      await queryRunner.manager.save(Customer, customer);
      return customer;
    } else {

      const customer = await this.customersRepository.findOne({
        where: {
          id: customerId,
          workspace: { id: account?.teams?.[0]?.organization?.workspaces?.[0].id }
        }
      });
      if (!customer) {
        throw new Error(`Customer with ID ${customerId} not found`);
      }
      if (Array.isArray(customer[fieldName])) {
        (customer[fieldName] as any) = [ ...customer[fieldName], ...newValue ];
      }
      else if (typeof customer[fieldName] === 'object' && customer[fieldName] !== null) {
        (customer[fieldName] as any) = { ...customer[fieldName], ...newValue };
      } else {
        (customer as any)[fieldName] = newValue;
      }
      await this.customersRepository.save(customer);
      return customer;

    }
  }

  async returnAllPeopleInfo(
    account: Account,
    session: string,
    take = 100,
    skip = 0,
    checkInSegment?: string,
    searchKey?: string,
    searchValue?: string,
    showFreezed?: boolean,
    createdAtSortType?: 'asc' | 'desc'
  ) {
    const { data, totalPages } = await this.findAll(
      <Account>account,
      session,
      take,
      skip,
      searchKey,
      searchValue,
      showFreezed,
      createdAtSortType || 'desc'
    );
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    const pk = await this.customerKeysService.getPrimaryKey(workspace.id, session);

    const listInfo = await Promise.all(
      data.map(async (person) => {
        const info: Record<string, any> = {};
        (info['id'] = person['uuid'].toString()),
          (info['salient'] =
            person['phEmail'] ||
            person['email'] ||
            person['slackEmail'] ||
            person['slackRealName'] ||
            '...');

        info.email = person.user_attributes.email;
        info.phone = person.user_attributes.phone;
        info.createdAt = new Date(person.created_at);
        /*
        info.createdAt = new Date(
          parseInt(person._id.toString().slice(0, 8), 16) * 1000
        ).toUTCString();
        */
        info.dataSource = 'people';

        if (pk && person[pk.name]) {
          info[pk.name] = person[pk.name];
        }

        if (checkInSegment)
          info.isInsideSegment = await this.segmentCustomersService.isCustomerInSegment(
            workspace.id,
            checkInSegment,
            person.id.toString()
          );

        return info;
      })
    );

    return { data: listInfo, totalPages, pkName: pk?.name };
  }

  async ingestPosthogPersons(
    proj: string,
    phAuth: string,
    phUrl: string,
    account: Account,
    session: string
  ) {
    let posthogUrl: string;
    if (phUrl[phUrl.length - 1] == '/') {
      posthogUrl = phUrl + 'api/projects/' + proj + '/persons/';
    } else {
      posthogUrl = phUrl + '/api/projects/' + proj + '/persons/';
    }
    const authString = 'Bearer ' + phAuth;
    try {
      await Producer.add(QueueType.CUSTOMERS, {
        url: posthogUrl,
        auth: authString,
        account: account,
      }, 'sync');
    } catch (e) {
      this.error(e, this.ingestPosthogPersons.name, session);
    }
  }

  async findByCustomerId(account: Account, id: string): Promise<Customer> {
    return this.customersRepository.findOne({
      where: {
        id,
        workspace_id: account?.teams?.[0]?.organization?.workspaces?.[0].id
      }
    });
  }

  async findByCustomerIdUnauthenticated(id: string, queryRunner?: QueryRunner) {
    let res;
    if (queryRunner) {
      res = await queryRunner.manager.find(Customer, {
        where: {
          id,
        }
      })
    } else {
      res = await this.customersRepository.find({
        where: {
          id,
        }
      })
    }
    return res.length ? res[0] : null;
  }

  /*
  * TODO: Fill this in
  */
  async deleteFromWorkspace(workspaceId: string, session: string, queryRunner?: QueryRunner) {
    return;
  }

  async findAllInWorkspace(workspaceId: string, session: string) {
    return this.customersRepository.find({
      where: { workspace: { id: workspaceId } }
    });
  }
  /**
   * Finds all customers that match conditions.
   *
   * @remarks
   * TODO: translate segment conditions to mongo query
   *
   * @param {string} account The owner of the customers; if a string, its the id,otherwise its an account object
   * @param {any} criteria Conditions to match on
   * @param {string} session Session identifier
   * @param {number} [skip] How many documents to skip; used for pagination
   * @param {number} [limit] Max no. documents to return; used for pagination
   *
   * @returns {Promise<CustomerDocument[]>} Array of customer documents
   *
   */
  async find(
    account: Account,
    criteria: any,
    session: string,
    skip?: number,
    limit?: number,
    collectionName?: string
  ): Promise<Customer[] | any[]> {
    let query: any;
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];
    let customers: any[];

    if (
      !criteria ||
      criteria.type === 'allCustomers' ||
      !criteria.query ||
      !criteria.query.statements ||
      !criteria.query.statements.length
    ) {
      return this.findAllInWorkspace(workspace.id, session);
    } else {
      // enfore workspace_id
      const query: Query = Query.fromJSON(criteria);
      const customers = query.execute(this.dataSource);

      return customers;
    }
  }

  /**
   * Finds size of audience that match the some inclusion criteria.
   * Uses count under the hood.
   *
   * @remarks
   * Still need to translate segment conditions to mongo query
   *
   * @param account  The owner of the customers
   * @param criteria Inclusion criteria to match on
   * @param session Session ID
   * @param transactionSession Mongo transaction object
   *
   * @returns Size of audience based on inclusion criteria
   *
   */
  async getAudienceSize(
    account: Account,
    criteria: any,
    session: string,
  ): Promise<{ collectionName: string; count: number }> {
    return {collectionName: "", count: 0};

    let collectionName: string;
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];
    let collectionPrefix: string;
    let count = 0;
    let query: any;
    if (
      !criteria ||
      criteria.type === 'allCustomers' ||
      !criteria.query ||
      !criteria.query.statements ||
      !criteria.query.statements.length
    ) {
      query = {
        workspaceId: workspace.id,
      };
      count = await query.exec();
    } else {
      collectionPrefix = this.segmentsService.generateRandomString();
      const customersInSegment = await this.getCustomersFromQuery(
        criteria.query,
        account,
        session,
        true,
        0,
        collectionPrefix
      );
      collectionName = customersInSegment; // Name of the MongoDB collection
    }

    return { collectionName, count };
  }

  checkInclusion(
    customer: Customer,
    inclusionCriteria: any,
    session: string,
    account?: Account
  ) {
    return this.stepsHelper.checkInclusion(
      customer,
      inclusionCriteria,
      session,
      account
    );
  }

  // get keys that weren't marked as primary but may be used
  // as channels for sending messages (e.g. email, email_address,
  // phone, phone_number, etc..)
  async getMessageChannelsCustomerKeys(workspaceId: string, session: string): Promise<string[]> {
    let keys = [];

    const customerKeys = await this.customerKeysService.getAll(workspaceId, session);

    for (const customerKey of customerKeys) {
      if (
        customerKey.is_primary ||
        (customerKey.attribute_type.name !== AttributeTypeName.STRING &&
          customerKey.attribute_type.name !== AttributeTypeName.EMAIL)
      )
        continue;

      let customerKeyName = customerKey.name;

      for (const [channel, channelRules] of Object.entries(rules)) {
        let matchFound = false;

        for (const regexRule of channelRules) {
          let regex = new RegExp(regexRule, 'i');
          let result = regex.exec(customerKeyName);

          if (result) {
            matchFound = true;
            break;
          }
        }

        if (matchFound) {
          keys.push(customerKeyName);

          this.logger.log(
            `Matched channel ${channel} with customerKey ${customerKeyName}`,
            this.getMessageChannelsCustomerKeys.name
          );
          break;
        }
      }
    }

    return keys;
  }

  async extractSearchOptionsFromObject(
    workspaceId: string,
    searchOptionsInitial: CustomerSearchOptions,
    session: string,
    object: Record<string, any>
  ): Promise<CustomerSearchOptions> {
    let result: CustomerSearchOptions = {
      primaryKey: {},
      messageChannels: {},
      correlationValue: '',
    };

    if (!object) {
      _.merge(result, searchOptionsInitial);
      return result;
    }

    result.primaryKey.name = object.primaryKeyName;
    result.primaryKey.value = object.primaryKeyValue;

    if (result.primaryKey.value && !result.primaryKey.name) {
      let primaryKey = await this.getPrimaryKeyStrict(workspaceId, session);
      result.primaryKey.name = primaryKey?.name;
    }

    result.correlationValue = object.correlationValue;

    // try to find customers via message channel fields
    const messageChannelsKeys = await this.getMessageChannelsCustomerKeys(
      workspaceId,
      session
    );

    for (const messageChannelsKey of messageChannelsKeys) {
      let objectFieldValue = this.getFieldValueFromObject(
        object,
        messageChannelsKey
      );

      if (objectFieldValue) {
        result.messageChannels[messageChannelsKey] = objectFieldValue;
      }
    }

    _.merge(result, searchOptionsInitial);

    return result;
  }

  getFieldValueFromObject(object: any, fieldName: string): any {
    if (!object) return null;

    let objectToUse: any = object;

    if (
      object.$fcm &&
      (fieldName == 'iosDeviceToken' || fieldName == 'androidDeviceToken')
    )
      objectToUse = object.$fcm;

    return objectToUse[fieldName];
  }

  /**
   * Finds customers with a CustomerSearchOptions object
   * @param workspaceId
   * @param searchOptionsInitial
   * @param session
   * @param object (e.g. event)
   * @returns CustomerSearchOptionResult[]
   */
  async findCustomersBySearchOptions(
    workspaceId: string,
    searchOptionsInitial: CustomerSearchOptions,
    session: string,
    object?: Record<string, any>
  ): Promise<CustomerSearchOptionResult[]> {
    let result: CustomerSearchOptionResult[] = [];

    const searchOptions = await this.extractSearchOptionsFromObject(
      workspaceId,
      searchOptionsInitial,
      session,
      object
    );

    const findConditions = [];

    if (searchOptions.primaryKey.value) {
      findConditions.push(
        new Brackets((qb) => {
          qb.where(`customer.user_attributes ->> :key = :value`, {
            key: searchOptions.primaryKey.name,
            value: searchOptions.primaryKey.value,
          }).andWhere('customer.workspace_id = :workspaceId', { workspaceId });
        })
      );
    }

    Object.keys(searchOptions.messageChannels).forEach((attributeName) => {
      findConditions.push(
        new Brackets((qb) => {
          qb.where(`customer.user_attributes ->> :attributeName = :attributeValue`, {
            attributeName,
            attributeValue: searchOptions.messageChannels[attributeName],
          }).andWhere('customer.workspace_id = :workspaceId', { workspaceId });
        })
      );
    });

    if (searchOptions.correlationValue) {
      findConditions.push(
        new Brackets((qb) => {
          qb.where('customer.uuid::text = :correlationValue', {
            correlationValue: searchOptions.correlationValue,
          })
            .orWhere(':correlationValue = ANY(customer.other_ids)', {
              correlationValue: searchOptions.correlationValue,
            })
            .andWhere('customer.workspace_id = :workspaceId', { workspaceId });
        })
      );
    }

    const queryBuilder = this.customersRepository.createQueryBuilder('customer');

    findConditions.forEach((condition) => {
      queryBuilder.orWhere(condition);
    });

    const customers = await queryBuilder.getMany();

    for (const findType of Object.values(FindType)) {
      for (let i = 0; i < customers.length; i++) {
        if (
          findType == FindType.PRIMARY_KEY &&
          searchOptions.primaryKey.name &&
          customers[i].getUserAttribute(searchOptions.primaryKey.name) ==
          searchOptions.primaryKey.value
        ) {
          result.push({
            customer: customers[i],
            findType,
          });
        } else if (findType == FindType.MESSAGE_CHANNEL) {
          // find which field from the customer matches the object's
          for (const attributeName in searchOptions.messageChannels) {
            let objectFieldValue = searchOptions.messageChannels[attributeName];

            if (objectFieldValue == customers[i].getUserAttribute(attributeName)) {
              result.push({
                customer: customers[i],
                findType,
              });

              break;
            }
          }
        } else if (
          findType == FindType.CORRELATION_VALUE &&
          customers[i].uuid == searchOptions.correlationValue
        ) {
          result.push({
            customer: customers[i],
            findType,
          });
        } else if (
          findType == FindType.OTHER_IDS &&
          searchOptions.correlationValue &&
          customers[i].other_ids.includes(
            searchOptions.correlationValue.toString()
          )
        ) {
          result.push({
            customer: customers[i],
            findType,
          });
        }
      }
    }

    // our conditions were not inclusive, something's wrong
    if (customers.length > 0 && result.length == 0) {
      this.error(
        'DB returned multiple customers but could not select one of them',
        this.findCustomersBySearchOptions.name,
        session
      );
    }

    return result;
  }

  /**
   * Finds a customer with a CustomerSearchOptions object
   * @param workspaceId
   * @param searchOptionsInitial
   * @param session
   * @param object (e.g. event)
   * @returns customer
   */
  async findCustomerBySearchOptions(
    workspaceId: string,
    searchOptionsInitial: CustomerSearchOptions,
    session: string,
    object?: Record<string, any>
  ): Promise<CustomerSearchOptionResult> {
    let customer: Customer;
    let findType: FindType;
    let result: CustomerSearchOptionResult = {
      customer: null,
      findType: null,
    };

    const searchResults = await this.findCustomersBySearchOptions(
      workspaceId,
      searchOptionsInitial,
      session,
      object
    );

    if (searchResults.length > 0) {
      result = searchResults[0];
    }

    return result;
  }

  /**
   * Finds a customer by CustomerSearchOptions and creates one if none was found
   * @param workspaceId
   * @param searchOptionsInitial
   * @param session
   * @param systemSource (i.e. event, upsert)
   * @param customerUpsertData
   * @param object (e.g. event)
   * @returns customer
   */
  async findOrCreateCustomerBySearchOptions(
    workspace: Workspaces,
    searchOptionsInitial: CustomerSearchOptions,
    session: string,
    customerUpsertData: Record<string, any>,
    systemSource: string,
    object?: Record<string, any>
  ): Promise<CustomerSearchOptionResult> {
    const searchOptions = await this.extractSearchOptionsFromObject(
      workspace.id,
      searchOptionsInitial,
      session,
      object
    );

    let result = await this.findCustomerBySearchOptions(
      workspace.id,
      searchOptions,
      session,
      object
    );

    // If customer still not found, create a new one
    if (!result.customer) {
      const customer = new Customer();
      customer.uuid = searchOptions.correlationValue || uuidv7();
      customer.workspace = workspace;
      customer.created_at = new Date();
      customer.user_attributes = {
        [searchOptions.primaryKey?.name]: searchOptions.primaryKey?.value,
        ...searchOptions.messageChannels,
        ...customerUpsertData
      }
      customer.system_attributes = {
        isAnonymous: searchOptions.primaryKey ? false : true
      }

      try {
        result.customer = await this.customersRepository.save(customer);
        result.findType = FindType.UPSERT; // Set findType to UPSERT to indicate an upsert operation
      } catch (error: any) {
        this.error(
          error,
          this.findOrCreateCustomerBySearchOptions.name,
          session
        );

        throw error;
      }
    }

    if (object && object.$fcm) {
      const { iosDeviceToken, androidDeviceToken } = object.$fcm;
      const deviceTokenField = iosDeviceToken
        ? 'iosDeviceToken'
        : 'androidDeviceToken';
      const deviceTokenValue = iosDeviceToken || androidDeviceToken;
      const deviceTokenSetAtField = iosDeviceToken
        ? 'iosDeviceTokenSetAt'
        : 'androidDeviceTokenSetAt';
      if (
        result.customer &&
        result.customer[deviceTokenField] !== deviceTokenValue
      ) {

        const customer = await this.customersRepository.findOne({
          where: { id: result.customer.id, workspace: { id: workspace.id } },
        });

        if (customer) {
          // Dynamically setting the fields
          customer.user_attributes[deviceTokenField] = deviceTokenValue;
          customer.system_attributes[deviceTokenSetAtField] = new Date();

          // Save the updated entity and return the updated result
          result.customer = await this.customersRepository.save(customer);
        }
      }
    }

    return result;
  }

  /**
   * Upsert a customer into the customer database. Requires a primary key
   * to have been set.
   * @param account
   * @param upsertCustomerDto
   * @param session
   * @returns
   */
  //to do add customer limit check here
  async upsert(
    auth: { account: Account; workspace: Workspaces },
    upsertCustomerDto: UpsertCustomerDto,
    session: string
  ): Promise<{ id: string }> {
    try {
      let primaryKey = await this.getPrimaryKeyStrict(
        auth.workspace.id,
        session
      );

      if (!primaryKey)
        throw new HttpException(
          'Primary key has not been set: see https://laudspeaker.com/docs/developer/api/users/upsert for more details.',
          HttpStatus.BAD_REQUEST
        );

      let { customer, findType } =
        await this.findOrCreateCustomerBySearchOptions(
          auth.workspace,
          {
            primaryKey: {
              name: primaryKey.name,
              value: upsertCustomerDto.primary_key,
            },
          },
          session,
          { ...upsertCustomerDto.properties },
          'upsert',
          // send the upsert proprties once for upsert data and another for
          // trying to find customers via message channels
          { ...upsertCustomerDto.properties }
        );

      return Promise.resolve({ id: customer.id.toString() });
    } catch (err) {
      this.error(err, this.upsert.name, session, auth.account.email);
      throw err;
    }
  }

  async removeById(account: Account, custId: string, session: string) {
    this.debug(
      `Removing customer ${JSON.stringify({ id: custId })}`,
      this.removeById.name,
      session,
      account.id
    );

    const cust = await this.findByCustomerIdUnauthenticated(custId);
    this.debug(
      `Found customer ${JSON.stringify(cust)}`,
      this.removeById.name,
      session,
      account.id
    );

    const res = await this.customersRepository.delete({ id: cust.id });
    this.debug(
      `Deleted customer ${JSON.stringify(res)}`,
      this.removeById.name,
      session,
      account.id
    );
  }

  async getAttributes(account: Account, resourceId: string, session: string) {
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    const attributes = await this.customerKeysService.getAll(workspace.id, session)
    if (resourceId === 'attributes') {
      return {
        id: resourceId,
        nextResourceURL: 'attributeConditions',
        options: attributes.map((attribute) => ({
          label: attribute.name,
          id: attribute.name,
          nextResourceURL: attribute.name,
        })),
        type: 'select',
      };
    }

    const attribute = attributes.find(
      (attribute) => attribute.name === resourceId
    );
    if (attribute)
      return {
        id: resourceId,
        options: attributeConditions(attribute.attribute_type.name, attribute.attribute_type.name === AttributeTypeName.ARRAY),
        type: 'select',
      };

    if (resourceId === 'memberof') {
      const segments = await this.segmentsService.segmentRepository.findBy({
        workspace_id: workspace.id,
      });
      return {
        id: resourceId,
        options: segments.map((segment) => ({
          id: segment.id,
          label: segment.name,
        })),
        type: 'select',
      };
    }

    return (
      mockData.resources.find((resource) => resource.id === resourceId) || {}
    );
  }

  private async removeFile(filePath: string): Promise<void> {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error(`Error removing file: ${filePath}`, err);
      } else {
        console.log(`Successfully removed file: ${filePath}`);
      }
    });
  }

  async uploadCSV(
    account: Account,
    csvFile: Express.Multer.File,
    session: string
  ) {
    if (csvFile?.mimetype !== 'text/csv')
      throw new BadRequestException('Only CSV files are allowed');

    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];
    try {
      const errorPromise = new Promise<{
        headers: string[];
        emptyCount: number;
        firstThreeRecords: Object[];
      }>((resolve, reject) => {
        let headers = [];
        const firstThreeRecords = [];
        let recordCount = 0;
        let emptyCount = 0;

        const fileStream = fs.createReadStream(csvFile.path);

        fastcsv
          .parseStream(fileStream, {
            headers: true,
            delimiter: ',',
            encoding: 'utf-8',
          })
          .on('data', (record) => {
            if (!headers.length) headers = Object.keys(record);

            if (recordCount < 3) {
              firstThreeRecords.push(record);
              recordCount++;
            }

            Object.values(record).forEach((el) => {
              if (!el) {
                emptyCount += 1;
              }
            });

            return recordCount <= 3 ? record : false;
          })
          .on('error', (error) => {
            reject(error);
          })
          .on('finish', () => {
            resolve({ headers, firstThreeRecords, emptyCount });
          });
      });

      const res = await errorPromise;

      const primaryAttribute = await this.customerKeysService.getPrimaryKey(workspace.id, session);

      if (primaryAttribute && !res.headers.includes(primaryAttribute.name)) {
        throw new BadRequestException(
          `CSV file should contain column with same name as defined Primary key: ${primaryAttribute.name}`
        );
      }

      const headers: Record<string, { header: string; preview: any[] }> = {};
      res.headers.forEach((header) => {
        if (!headers[header])
          headers[header] = {
            header: '',
            preview: [],
          };

        res.firstThreeRecords.forEach((record) => {
          headers[header].header = header;
          headers[header].preview.push(record[header] || '');
        });
      });

      try {
        await this.removeImportFile(account);
      } catch (error) {
        this.error(error, this.uploadCSV.name, account.email, session);
      }

      const { key } = await this.s3Service.uploadCustomerImportFile(
        csvFile,
        account
      );
      const fName = csvFile?.originalname || 'Unknown name';

      const importRes = await this.importsRepository.save({
        account,
        fileKey: key,
        fileName: fName,
        headers: headers,
        emptyCount: res.emptyCount,
      });

      await this.removeFile(csvFile.path);

      return;
    } catch (error) {
      this.error(error, this.uploadCSV.name, session);
      this.removeImportFile(account);
      // Local file removal
      await this.removeFile(csvFile.path);
      throw error;
    }
  }

  async deleteImportFile(account: Account, fileKey: string, session?: string) {
    try {
      const importFile = await this.importsRepository.findOneBy({
        account: {
          id: account.id,
        },
        fileKey,
      });
      if (importFile) {
        await this.removeImportFile(account, fileKey);
      }
    } catch (error) {
      this.error(error, this.deleteImportFile.name, session);
      throw new BadRequestException(
        `Error getting last importedCSV, account ${account.id}, sessions:${session}`
      );
    }
  }

  async getLastImportCSV(account: Account, session?: string) {
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    try {
      const importFile = await this.importsRepository.findOneBy({
        account: {
          id: account.id,
        },
      });

      const primaryAttribute = await this.customerKeysService.getPrimaryKey(workspace.id, session);

      const response = { ...importFile, primaryAttribute: undefined };
      if (primaryAttribute) {
        response.primaryAttribute = primaryAttribute;
      }
      return response;
    } catch (error) {
      this.error(error, this.getLastImportCSV.name, session);
      throw new BadRequestException(
        `Error getting last importedCSV, account ${account.id}, sessions:${session}`
      );
    }
  }

  async removeImportFile(account: Account, fileKey?: string) {
    const previousImport = await this.importsRepository.findOneBy({
      account: {
        id: account.id,
      },
      fileKey,
    });

    if (!previousImport) {
      this.warn(
        "Can't find imported file for deletion.",
        this.removeImportFile.name,
        ''
      );
      return;
    }

    await this.s3Service.deleteFile(previousImport.fileKey, account, true);
    await previousImport.remove();
  }

  // TODO: remove after new implementation finished
  async loadCSV(
    account: Account,
    csvFile: Express.Multer.File,
    session: string
  ) {
    if (csvFile.mimetype !== 'text/csv')
      throw new BadRequestException('Only CSV files are allowed');

    const stats: { created: 0; updated: 0; skipped: 0; customers: string[] } = {
      created: 0,
      updated: 0,
      skipped: 0,
      customers: [],
    };

    const records = parse(csvFile.buffer, {
      columns: true,
      skipEmptyLines: true,
    });
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    for await (const record of records) {
      if (record.email) {
        let customer = null;

        if (customer) {
          await this.update(account, customer._id, record, session);
          stats.updated++;
        } else {
          delete record.verified;
          delete record.workspaceId;
          delete record._id;
          delete record.__v;
          delete record.audiences;

          customer = await this.create(account, { ...record }, session);
          stats.created++;
        }
        stats.customers.push(customer._id);
      } else {
        stats.skipped++;
      }
    }

    return { stats };
  }

  public async deleteEverywhere(id: string) {
    await this.dataSource.transaction(async (transactionManager) => {
      await transactionManager.delete(SegmentCustomers, { customer_id: id });
      await transactionManager.query(
        'UPDATE audience SET customers = array_remove(audience."customers", $1) WHERE $2 = ANY(audience."customers")',
        [id, id]
      );
    });
  }

  public async getSystemAttributes() {
    return undefined;
  }


  public async getCustomersFromStepStatsByEvent(
    account: Account,
    session: string,
    take = 100,
    skip = 0,
    event?: string,
    stepId?: string
  ) {
    if (take > 100) take = 100;

    if (eventsMap[event] && stepId) {
      const customersCountResponse = await this.clickhouseClient.query({
        query: `SELECT COUNT(DISTINCT(customerId)) FROM ${ClickHouseTable.MESSAGE_STATUS} WHERE stepId = {stepId:UUID} AND event = {event:String}`,
        query_params: { stepId, event: eventsMap[event] },
      });
      const customersCountResponseData = (
        await customersCountResponse.json<{ 'count()': string }>()
      )?.data;
      const customersCount = +customersCountResponseData?.[0]?.['count()'] || 1;

      const totalPages = Math.ceil(customersCount / take);

      const response = await this.clickhouseClient.query({
        query: `SELECT DISTINCT(customerId) FROM ${ClickHouseTable.MESSAGE_STATUS} WHERE stepId = {stepId:UUID} AND event = {event:String} ORDER BY createdAt LIMIT {take:Int32} OFFSET {skip:Int32}`,
        query_params: { stepId, event: eventsMap[event], take, skip },
      });
      const data = (await response.json<{ customerId: string }>())
        ?.data;
      const customerIds = data?.map((item) => item.customerId) || [];

      return {
        totalPages,
        data: await Promise.all(
          customerIds.map(async (id) => ({
            ...(await this.findByCustomerId(account, id)),
            id,
          }))
        ),
      };
    }
  }

  public async countCustomersInStep(account: Account, stepId: string) {
    return 0;
  }

  public async bulkCountCustomersInSteps(account: Account, stepIds: string[]) {
    const result: number[] = [];

    for (const stepId of stepIds) {
      try {
        result.push(await this.countCustomersInStep(account, stepId));
      } catch (e) {
        result.push(0);
      }
    }

    return result;
  }

  public async getCustomersInStep(
    account: Account,
    stepId: string,
    take = 100,
    skip = 0
  ) {
    return {
      data: [],
      totalPages: 0,
    };
  }

  public async isCustomerEnrolledInJourney(
    account: Account,
    customer: Customer,
    journey: Journey,
    session: string,
    queryRunner: QueryRunner
  ) {
    // TODO_JH: update to journey location table as source of truth
    const location = await this.journeyLocationsService.find(
      journey,
      customer,
      session,
      account,
      queryRunner
    );
    return !!location;
  }

  public async getCustomerJourneys(
    user: Account,
    custId: string,
    take: number,
    skip: number
  ) {
    const workspace = user?.teams?.[0]?.organization?.workspaces?.[0];

    const customer = await this.customersRepository.findOneBy(
      {
        id: custId,
        workspace: { id: workspace.id },
      });

    if (!customer) {
      throw new HttpException('Such customer not found', HttpStatus.FORBIDDEN);
    }

    const [data, count] =
      await this.journeyLocationsService.journeyLocationsRepository.findAndCount(
        {
          where: { workspace: { id: workspace.id }, customer: { id: customer.id } },
          take,
          skip,
          relations: ['journey', 'step'],
        }
      );

    const totalPages = Math.ceil(count / take) || 1;

    return {
      data: data.map((el) => ({
        ...(el.journey as any),
        isFinished: el.step.metadata?.destination
          ? false
          : (!el.step.metadata?.branches && !el.step.metadata?.timeBranch) ||
          (el.step.metadata?.branches?.length === 0 &&
            !el.step.metadata?.timeBranch) ||
          (el.step.metadata?.branches?.every(
            (branch) => !branch?.destination
          ) &&
            !el.step.metadata?.timeBranch?.destination),
        enrollmentTime: +el.journeyEntry,
      })),
      total: totalPages,
    };
  }

  async customersSize(account: Account, session: string) {
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    const totalNumberOfCustomers = this.customersRepository.countBy(
      {
        workspace: { id: workspace.id },
      }
    );

    return totalNumberOfCustomers;
  }

  /**
   * Gets count of customers from and query
   * includes messages,
   *
   *  eg email from journey a, email 1 has been received
   *
   * Handles top level query with And
   *
   * @returns count
   */

  async CountCustomersFromAndQuery(
    query: any,
    account: Account,
    session: string,
    topLevel: boolean,
    count: number,
    intermediateCollection?: string
  ): Promise<string> {
    this.debug(
      'Creating segment from query',
      this.CountCustomersFromAndQuery.name,
      session
    );

    //create collectionName
    let collectionName: string;
    let thisCollectionName: string;
    if (count == 0) {
      collectionName = intermediateCollection;
    } else {
      collectionName = intermediateCollection + count;
    }
    thisCollectionName = collectionName;
    count = count + 1;
    //collectionName = collectionName + count;

    if (query.type === 'all') {
      console.log('the query has all (AND)');
      if (!query.statements || query.statements.length === 0) {
        return; //new Set<string>(); // Return an empty set
      }
      const sets = await Promise.all(
        query.statements.map(async (statement) => {
          return await this.getSegmentCustomersFromSubQuery(
            statement,
            account,
            session,
            count++,
            collectionName + count
          );
        })
      );
      this.debug(
        `the sets are: ${sets}`,
        this.getSegmentCustomersFromQuery.name,
        session,
        account.id
      );
      this.debug(
        `about to reduce the sets`,
        this.getSegmentCustomersFromQuery.name,
        session,
        account.id
      );
      this.debug(
        `the sets length: ${sets.length}`,
        this.getSegmentCustomersFromQuery.name,
        session,
        account.id
      );
      const unionAggregation: any[] = [];
      //if (sets.length > 1) {
      // Add each additional collection to the pipeline for union
      sets.forEach((collName) => {
        //console.log("the set is", collName);
        unionAggregation.push({ $unionWith: { coll: collName } });
      });
      // Group by customerId and count occurrences
      unionAggregation.push(
        { $group: { _id: '$_id', count: { $sum: 1 } } },
        //{ $group: { _id: "$customerId", count: { $sum: 1 } } },
        { $match: { count: sets.length } } // Match only IDs present in all subqueries
      );
      //} else if (sets.length === 1) {
      //  console.log("sets length 1");
      // If there's only one collection, no matching
      //} else {
      //  console.log("No collections to process.");
      //  return; // Exit if there are no collections
      //}
      unionAggregation.push({ $out: thisCollectionName });

      //console.log("the first collection is", thisCollectionName);
      //console.log("union aggreagation is", JSON.stringify(unionAggregation,null,2));

      // Perform the aggregation on the first collection

      if (topLevel) {
        //for each count drop the collections up to the last one
        sets.map(async (collection) => {
          try {
            this.debug(
              `trying to release collection`,
              this.getSegmentCustomersFromQuery.name,
              session,
              account.id
            );
            //toggle for testing segments
            this.debug(
              `dropped successfully`,
              this.getSegmentCustomersFromQuery.name,
              session,
              account.id
            );
          } catch (e) {
            this.debug(
              `error dropping collection: ${e}`,
              this.getSegmentCustomersFromQuery.name,
              session,
              account.id
            );
          }
        });
      }
      return thisCollectionName; // mergedSet;
    }
    //shouldn't get here;
    return ''; // Default: Return an empty set
  }

  /*
   * To support document db we have to move some of the processing to the application side
   *
   * Specifically we can't use unionWith and merge
   *
   */

  async documentDBanySegmentCase(
    account: Account,
    session: string,
    sets: any[],
    collectionName: string,
    thisCollectionName: string,
    finalCollectionPrepend: string,
    andOr?: string
  ) {
    this.debug(
      `document db replacing unionWith`,
      this.getCustomersFromQuery.name,
      session,
      account.id
    );
    // Add lookups for each additional collection to the pipeline
    // Step 1: Create new collections from each set with a new _id and rename _id to customerId
    const newCollectionNames = await Promise.all(
      sets.map(async (collName, index) => {
        const newCollName = `new_${collName}`;
        this.debug(
          `document db new col name ${collName}`,
          this.getCustomersFromQuery.name,
          session,
          account.id
        );
        return newCollName;
      })
    );
    //console.log("union aggregation is", JSON.stringify(unionAggregation, null, 2 ));
    // Step 2: Bulk insert documents from each new collection into a final collection, in batches
    const BATCH_SIZE = +process.env.DOCUMENT_DB_BATCH_SIZE || 50000;
    const finalCollection = `${finalCollectionPrepend}${collectionName}`;
    await Promise.all(
      newCollectionNames.map(async (newCollName) => {
        let batch = [];

        // Process any remaining documents in the last batch
        if (batch.length > 0) {
        }
      })
    );

    // Step 3 AND CASE: Aggregate in finalCollection to group by customerId and project it back as the _id
    if (andOr === 'and') {
      // Step 3: Aggregate in finalCollection to group by customerId and project it back as the _id
    }
    // Step 3 OR CASE: Aggregate in finalCollection to group by customerId and project it back as the _id
    else {
    }

    //drop all intermediate collections
    try {
      this.debug(
        `trying to release finalcollection`,
        this.getCustomersFromQuery.name,
        session,
        account.id
      );
      //toggle for testing segments
      this.debug(
        `dropped successfully`,
        this.getCustomersFromQuery.name,
        session,
        account.id
      );
    } catch (e) {
      this.debug(
        `error dropping collection: ${e}`,
        this.getCustomersFromQuery.name,
        session,
        account.id
      );
    }

    newCollectionNames.map(async (collection) => {
      try {
        this.debug(
          `trying to release collection`,
          this.getCustomersFromQuery.name,
          session,
          account.id
        );
        //toggle for testing segments
        this.debug(
          `dropped successfully`,
          this.getCustomersFromQuery.name,
          session,
          account.id
        );
      } catch (e) {
        this.debug(
          `error dropping collection: ${e}`,
          this.getCustomersFromQuery.name,
          session,
          account.id
        );
      }
    });
  }

  /*
   *
   *
   * Takes in a segment query (inclusion criteria) and returns a string that is the name of a mongo collection of customers not customerIds
   *
   * @remarks
   * This has been initially optimized, but can likely be more optimized
   *
   */
  //to do create intermediate collection
  async getCustomersFromQuery(
    query: any,
    account: Account,
    session: string,
    topLevel: boolean,
    count: number,
    intermediateCollection?: string
  ): Promise<string> {
    this.debug(
      'Creating segment from query',
      this.getCustomersFromQuery.name,
      session
    );

    this.debug(
      `top level query is: ${JSON.stringify(query, null, 2)}`,
      this.getCustomersFromQuery.name,
      session,
      account.id
    );

    //create collectionName
    let collectionName: string;
    let thisCollectionName: string;
    if (count == 0) {
      collectionName = intermediateCollection;
    } else {
      collectionName = intermediateCollection + count;
    }
    thisCollectionName = collectionName;
    count = count + 1;
    //collectionName = collectionName + count;

    if (query.type === 'all') {
      console.log('the query has all (AND)');
      if (!query.statements || query.statements.length === 0) {
        return; //new Set<string>(); // Return an empty set
      }
      const sets = await Promise.all(
        query.statements.map(async (statement) => {
          return await this.getSegmentCustomersFromSubQuery(
            statement,
            account,
            session,
            count++,
            collectionName + count
          );
        })
      );
      this.debug(
        `the sets are: ${sets}`,
        this.getCustomersFromQuery.name,
        session,
        account.id
      );
      this.debug(
        `about to reduce the sets`,
        this.getCustomersFromQuery.name,
        session,
        account.id
      );
      this.debug(
        `the sets length: ${sets.length}`,
        this.getCustomersFromQuery.name,
        session,
        account.id
      );
      const unionAggregation: any[] = [];
      //if (sets.length > 1) {
      // Add each additional collection to the pipeline for union
      if (process.env.DOCUMENT_DB === 'true') {
        await this.documentDBanySegmentCase(
          account,
          session,
          sets,
          collectionName,
          thisCollectionName,
          'final_and_cfc_',
          'and'
        );
      } else {
        sets.forEach((collName) => {
          //console.log("the set is", collName);
          unionAggregation.push({ $unionWith: { coll: collName } });
        });
        // Group by customerId and count occurrences
        unionAggregation.push(
          { $group: { _id: '$_id', count: { $sum: 1 } } },
          //{ $group: { _id: "$customerId", count: { $sum: 1 } } },
          { $match: { count: sets.length } } // Match only IDs present in all subqueries
        );
        //} else if (sets.length === 1) {
        //  console.log("sets length 1");
        // If there's only one collection, no matching
        //} else {
        //  console.log("No collections to process.");
        //  return; // Exit if there are no collections
        //}
        unionAggregation.push({ $out: thisCollectionName });
        //console.log("the first collection is", thisCollectionName);
        //console.log("union aggreagation is", JSON.stringify(unionAggregation,null,2));
        // Perform the aggregation on the first collection
      }

      if (topLevel) {
        //for each count drop the collections up to the last one
        sets.map(async (collection) => {
          try {
            this.debug(
              `trying to release collection`,
              this.getCustomersFromQuery.name,
              session,
              account.id
            );
            //toggle for testing segments
            this.debug(
              `dropped successfully`,
              this.getCustomersFromQuery.name,
              session,
              account.id
            );
          } catch (e) {
            this.debug(
              `error dropping collection: ${e}`,
              this.getCustomersFromQuery.name,
              session,
              account.id
            );
          }
        });
      }

      const fullDetailsCollectionName = `${thisCollectionName}_FullDetails`;

      // Step 2-4: Perform a lookup aggregation to join and transfer to the new collection
      const finalAggregationPipeline = [
        {
          $lookup: {
            from: 'customers', // Replace with your actual collection name containing full details
            localField: '_id', // Adjust if necessary to match the linking field
            foreignField: '_id', // Adjust if necessary to match the linking field
            as: 'customerDetails',
          },
        },
        {
          $unwind: '$customerDetails', // Optional, to flatten the results if each ID maps to exactly one customer
        },
        {
          $replaceRoot: { newRoot: '$customerDetails' }, // Promotes customerDetails to the top level
        },
        {
          $out: fullDetailsCollectionName, // Output the results into the new collection
        },
      ];

      //return thisCollectionName; // mergedSet;

      return fullDetailsCollectionName;
    } else if (query.type === 'any') {
      if (!query.statements || query.statements.length === 0) {
        return ''; //new Set<string>(); // Return an empty set
      }

      const sets = await Promise.all(
        query.statements.map(async (statement) => {
          //console.log("collectionName is", collectionName);
          return await this.getSegmentCustomersFromSubQuery(
            statement,
            account,
            session,
            count++,
            collectionName + count
          );
        })
      );

      const unionAggregation: any[] = [];
      /*
      [
        { $group: { _id: "$customerId" } }
      ];
      */

      this.debug(
        `the sets are: ${sets}`,
        this.getCustomersFromQuery.name,
        session,
        account.id
      );
      this.debug(
        `about to union the sets`,
        this.getCustomersFromQuery.name,
        session,
        account.id
      );
      this.debug(
        `the sets length: ${sets.length}`,
        this.getCustomersFromQuery.name,
        session,
        account.id
      );

      if (process.env.DOCUMENT_DB === 'true') {
        await this.documentDBanySegmentCase(
          account,
          session,
          sets,
          collectionName,
          thisCollectionName,
          'final_or_cfq_'
        );
      } else {
        // Add each additional collection to the pipeline
        if (sets.length > 1) {
          sets.forEach((collName) => {
            unionAggregation.push({ $unionWith: { coll: collName } });
            //unionAggregation.push({ $unionWith: { coll: collName, pipeline: [{ $group: { _id: "$customerId" } }] } });
          });
        }
        //unique users
        //unionAggregation.push({ $group: { _id: "$customerId" } });
        unionAggregation.push({ $group: { _id: '$_id' } });

        // dump results to thisCollectionName
        unionAggregation.push({ $out: thisCollectionName });

        //console.log("the first collection is", sets[0]);
        // Perform the aggregation on the first collection
      }

      if (topLevel) {
        //for each count drop the collections up to the last one
        sets.map(async (collection) => {
          try {
            this.debug(
              `trying to release collection`,
              this.getCustomersFromQuery.name,
              session,
              account.id
            );
            //toggle for testing segments
            this.debug(
              `dropped successfully`,
              this.getCustomersFromQuery.name,
              session,
              account.id
            );
          } catch (e) {
            this.debug(
              `error dropping collection: ${e}`,
              this.getCustomersFromQuery.name,
              session,
              account.id
            );
          }
        });
      }

      const fullDetailsCollectionName = `${thisCollectionName}_FullDetails`;

      // Step 2-4: Perform a lookup aggregation to join and transfer to the new collection
      const finalAggregationPipeline = [
        {
          $lookup: {
            from: 'customers', // Replace with your actual collection name containing full details
            localField: '_id', // Adjust if necessary to match the linking field
            foreignField: '_id', // Adjust if necessary to match the linking field
            as: 'customerDetails',
          },
        },
        {
          $unwind: '$customerDetails', // Optional, to flatten the results if each ID maps to exactly one customer
        },
        {
          $replaceRoot: { newRoot: '$customerDetails' }, // Promotes customerDetails to the top level
        },
        {
          $out: fullDetailsCollectionName, // Output the results into the new collection
        },
      ];

      //return thisCollection
      return fullDetailsCollectionName;
    }
    //shouldn't get here;
    return ''; // Default: Return an empty set
  }

  /*
  * 
  * 
  * Takes in a segment query (inclusion criteria) and returns a string that is the name of a mongo collection of customerIds
  * NB a query is composed of SingleStatements, and sub queries (which we sometimes call statement with subquery)
  * 
  * @remarks
  * This has been initially optimized, but can likely be more optimized
  *
  * @param query eg "query": {
       "type": "all",
       "statements": [
         {
           "type": "Attribute",
           "key": "firstName",
           "comparisonType": "is equal to",
           "subComparisonType": "exist",
           "subComparisonValue": "",
           "valueType": "String",
           "value": "a"
         },
         {
           "type": "Attribute",
           "key": "lastName",
           "comparisonType": "is equal to",
           "subComparisonType": "exist",
           "subComparisonValue": "",
           "valueType": "String",
           "value": "b"
         }
       ]
     }
  *  
  *
  */
  //to do create intermediate collection
  async getSegmentCustomersFromQuery(
    query: any,
    account: Account,
    session: string,
    topLevel: boolean,
    count: number,
    intermediateCollection?: string
  ): Promise<string> {
    return Sentry.startSpan(
      { name: 'CustomersService.getSegmentCustomersFromQuery' },
      async () => {
        //create collectionName
        let collectionName: string;
        let thisCollectionName: string;
        if (count == 0) {
          collectionName = intermediateCollection;
        } else {
          collectionName = intermediateCollection + count;
        }
        thisCollectionName = collectionName;
        count = count + 1;
        //collectionName = collectionName + count;

        if (query.type === 'all') {
          if (!query.statements || query.statements.length === 0) {
            return; //new Set<string>(); // Return an empty set
          }
          const sets = await Promise.all(
            query.statements.map(async (statement) => {
              return await this.getSegmentCustomersFromSubQuery(
                statement,
                account,
                session,
                count++,
                collectionName + count
              );
            })
          );
          await Sentry.startSpan(
            {
              name: 'CustomersService.getSegmentCustomersFromQuery.unionAggregation',
            },
            async () => {
              const unionAggregation: any[] = [];
              // Perform the aggregation on the first collection

              if (process.env.DOCUMENT_DB === 'true') {
                await this.documentDBanySegmentCase(
                  account,
                  session,
                  sets,
                  collectionName,
                  thisCollectionName,
                  'final_and_scfq_',
                  'and'
                );
              } else {
                //if (sets.length > 1) {
                // Add each additional collection to the pipeline for union
                sets.forEach((collName) => {
                  //console.log("the set is", collName);
                  unionAggregation.push({ $unionWith: { coll: collName } });
                });
                // Group by customerId and count occurrences
                unionAggregation.push(
                  { $group: { _id: '$_id', count: { $sum: 1 } } },
                  //{ $group: { _id: "$customerId", count: { $sum: 1 } } },
                  { $match: { count: sets.length } } // Match only IDs present in all subqueries
                );
                //} else if (sets.length === 1) {
                //  console.log("sets length 1");
                // If there's only one collection, no matching
                //} else {
                //  console.log("No collections to process.");
                //  return; // Exit if there are no collections
                //}
                unionAggregation.push({ $out: thisCollectionName });
              }

              //console.log("the first collection is", thisCollectionName);
              //console.log("union aggreagation is", JSON.stringify(unionAggregation,null,2));

            }
          );

          if (topLevel) {
            //for each count drop the collections up to the last one
            sets.map(async (collection) => {
              try {
                this.debug(
                  `trying to release collection`,
                  this.getSegmentCustomersFromQuery.name,
                  session,
                  account.id
                );
                //toggle for testing segments
                this.debug(
                  `dropped successfully`,
                  this.getSegmentCustomersFromQuery.name,
                  session,
                  account.id
                );
              } catch (e) {
                this.debug(
                  `error dropping collection: ${e}`,
                  this.getSegmentCustomersFromQuery.name,
                  session,
                  account.id
                );
              }
            });
          }
          return thisCollectionName; // mergedSet;
        } else if (query.type === 'any') {
          console.log('the query has any (OR)');
          if (!query.statements || query.statements.length === 0) {
            return ''; //new Set<string>(); // Return an empty set
          }

          const sets = await Promise.all(
            query.statements.map(async (statement) => {
              //console.log("collectionName is", collectionName);
              return await this.getSegmentCustomersFromSubQuery(
                statement,
                account,
                session,
                count++,
                collectionName + count
              );
            })
          );

          const unionAggregation: any[] = [];

          if (process.env.DOCUMENT_DB === 'true') {
            await this.documentDBanySegmentCase(
              account,
              session,
              sets,
              collectionName,
              thisCollectionName,
              'final_or_gscfq_'
            );
          } else {
            // Add each additional collection to the pipeline
            if (sets.length > 1) {
              sets.forEach((collName) => {
                unionAggregation.push({ $unionWith: { coll: collName } });
                //unionAggregation.push({ $unionWith: { coll: collName, pipeline: [{ $group: { _id: "$customerId" } }] } });
              });
            }
            //unique users
            //unionAggregation.push({ $group: { _id: "$customerId" } });
            unionAggregation.push({ $group: { _id: '$_id' } });

            // dump results to thisCollectionName
            unionAggregation.push({ $out: thisCollectionName });

            //console.log("the first collection is", sets[0]);
            // Perform the aggregation on the first collection
          }

          if (topLevel) {
            //for each count drop the collections up to the last one
            sets.map(async (collection) => {
              try {
                this.debug(
                  `trying to release collection`,
                  this.getSegmentCustomersFromQuery.name,
                  session,
                  account.id
                );
                //toggle for testing segments
                this.debug(
                  `dropped successfully`,
                  this.getSegmentCustomersFromQuery.name,
                  session,
                  account.id
                );
              } catch (e) {
                this.debug(
                  `error dropping collection: ${e}`,
                  this.getSegmentCustomersFromQuery.name,
                  session,
                  account.id
                );
              }
            });
          }
          return thisCollectionName; // mergedSet;
        }
        //shouldn't get here;
        return ''; // Default: Return an empty set
      }
    );
  }

  /**
   * Helper function for getSegmentCustomersFromQuery
   *
   * Handle queries with subqueries
   *
   * @returns set of customers
   */
  async getSegmentCustomersFromSubQuery(
    statement: any,
    account: Account,
    session: string,
    count: number,
    intermediateCollection: string
  ) {
    return Sentry.startSpan(
      { name: 'CustomersService.getSegmentCustomersFromSubQuery' },
      async () => {
        if (statement.statements && statement.statements.length > 0) {
          // Statement has a subquery, recursively evaluate the subquery
          this.debug(
            `recursive subquery call`,
            this.getSegmentCustomersFromSubQuery.name,
            session,
            account.id
          );
          return this.getSegmentCustomersFromQuery(
            statement,
            account,
            session,
            false,
            count,
            intermediateCollection
          );
        } else {
          this.debug(
            `singleStatement call`,
            this.getSegmentCustomersFromSubQuery.name,
            session,
            account.id
          );
          return await this.getCustomersFromStatement(
            statement,
            account,
            session,
            count,
            intermediateCollection
          );
        }
      }
    );
  }

  /**
   * Routes to the right statement handler for getting customers
   *  essentially 3 types, Attribute, Event, Message
   *
   * Handles SINGLE statements not queries with subqueries
   *
   * @returns set of customers
   */
  async getCustomersFromStatement(
    statement: any,
    account: Account,
    session: string,
    count: number,
    intermediateCollection: string
  ) {
    const {
      key,
      type,
      comparisonType,
      subComparisonType,
      value,
      valueType,
      subComparisonValue,
    } = statement;
    this.debug(
      'In getCustomersFromStatement deciding which sub evaluate statement to go to next/n\n',
      this.getCustomersFromStatement.name,
      session,
      account.email
    );
    this.debug(
      `the key is: ${JSON.stringify(key, null, 2)}`,
      this.getCustomersFromStatement.name,
      session,
      account.id
    );

    this.debug(
      `the type is: ${JSON.stringify(type, null, 2)}`,
      this.getCustomersFromStatement.name,
      session,
      account.id
    );

    this.debug(
      `the value is: ${JSON.stringify(value, null, 2)}`,
      this.getCustomersFromStatement.name,
      session,
      account.id
    );

    this.debug(
      `the subComparisonValue is: ${JSON.stringify(
        subComparisonValue,
        null,
        2
      )}`,
      this.getCustomersFromStatement.name,
      session,
      account.id
    );

    switch (type) {
      case 'Attribute':
        return this.customersFromAttributeStatement(
          statement,
          account,
          session,
          count,
          intermediateCollection
        );
        break;
      case 'Event':
        return await this.customersFromEventStatement(
          statement,
          account,
          session,
          count,
          intermediateCollection
        );
      case 'Email':
        return this.customersFromMessageStatement(
          statement,
          account,
          'Email',
          session,
          count,
          intermediateCollection
        );
      case 'Push':
        return this.customersFromMessageStatement(
          statement,
          account,
          'Push',
          session,
          count,
          intermediateCollection
        );
      case 'SMS':
        return this.customersFromMessageStatement(
          statement,
          account,
          'SMS',
          session,
          count,
          intermediateCollection
        );
      case 'In-app message':
        return this.customersFromMessageStatement(
          statement,
          account,
          'In-app message',
          session,
          count,
          intermediateCollection
        );
      case 'Segment':
        return this.customersFromSegmentStatement(
          statement,
          account,
          session,
          count,
          intermediateCollection
        );
        break;
      default:
        throw new Error('Invalid comparison type');
    }
  }

  /**
   * Gets set of customers from a single statement that
   * includes segments,
   *
   *  eg segment1
   *
   * Handles SINGLE statements not queries with subqueries
   *
   * @returns mongo collection string with customers
   */

  async customersFromSegmentStatement(
    statement: any,
    account: Account,
    session: string,
    count: number,
    intermediateCollection: string
  ) {
    return Sentry.startSpan(
      { name: 'CustomersService.getSegmentCustomersFromSubQuery' },
      async () => {
        const { type, segmentId } = statement;
        return;
      }
    );
  }

  /**
   * Gets all journeys associated with a user and a specific tag.
   *
   * @param account
   * @param session
   * @param tag
   * @returns
   */

  //to do check with actual messages in clickhouse
  async getJourneysWithTag(
    account: Account,
    session: string,
    tag: string
  ): Promise<string[]> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const journeys = await queryRunner.manager
        .createQueryBuilder(Journey, 'journey')
        //.where('journey.ownerId = :ownerId', { owner: { id: account.id } })
        .where('journey.ownerId = :ownerId', { ownerId: account.id })
        //.where('journey.ownerId = "930fd606-2be2-4429-80a0-94fd3607dc66"')
        //.where('ownerId = :ownerId', { owner: { id: account.id } })
        .andWhere("journey.journeySettings -> 'tags' ? :tag", { tag })
        //.andWhere('journeySettings -> "tags" ? :tag', { tag })
        .getMany();

      //console.log("In getJourneysWithTag", JSON.stringify(journeys, null, 2));

      // Map each Journey object to its id
      const journeyIds = journeys.map((journey) => journey.id);
      console.log('journeyIds are', JSON.stringify(journeyIds, null, 2));

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
   * Gets all journeys associated with a user.
   *
   * @param account
   * @param name
   * @param session
   * @returns
   */

  async getJourneys(account: Account, session: string) {
    console.log('In getJourneys');

    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    try {
      const journeys = await queryRunner.manager.find(Journey, {
        where: { workspace: { id: workspace.id } },
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

  /*
  Case 1: Any Journey: 

  {
    type: 'Email',
    eventCondition: 'received',
    from: { key: 'ANY', title: 'Any journeys' },
    fromSpecificMessage: { key: 'ANY', title: 'Any message' },
    happenCondition: 'has',
    tag: 'a'
  }

  Case 2: Tagged Journey:

  {
    type: 'Email',
    eventCondition: 'received',
    from: { key: 'WITH_TAG', title: 'Journeys with a tag' },
    fromSpecificMessage: { key: 'ANY', title: 'Any message' },
    happenCondition: 'has',
    tag: 'a'
  }

  Case 3: Any Message, specific Journey:

  {
    type: 'Email',
    eventCondition: 'received',
    from: { key: '7627eab1-1b51-4df5-800f-0f413bea21dd', title: 'atag' },
    fromSpecificMessage: { key: 'ANY', title: 'Any email in this journey' },
    happenCondition: 'has'
  }

  Case 4: Specific Message, specific Journey:

  {
    tag: 'a',
    from: { key: '7627eab1-1b51-4df5-800f-0f413bea21dd', title: 'atag' },
    type: 'Email',
    eventCondition: 'received',
    happenCondition: 'has',
    fromSpecificMessage: { key: 'aa08729d-e80c-4546-9418-ece91cb686e3', title: 'Email 1' }
  }

*/

  /**
   * Gets set of customers from a single statement that
   * includes messages,
   *
   *  eg email from journey a, email 1 has been received
   *
   * Handles SINGLE statements not queries with subqueries
   *
   * @returns set of customers
   */

  async customersFromMessageStatement(
    statement: any,
    account: Account,
    typeOfMessage: string,
    session: string,
    count: number,
    intermediateCollection: string
  ) {
    return Sentry.startSpan(
      { name: 'CustomersService.customersFromMessageStatement' },
      async () => {
        const userId = (<Account>account).id;
        this.debug(
          'In get customers from message statement',
          this.customersFromMessageStatement.name,
          session,
          account.id
        );

        this.debug(
          `the type of message is: ${typeOfMessage}`,
          this.customersFromMessageStatement.name,
          session,
          account.id
        );

        this.debug(
          `account id is: ${userId}`,
          this.customersFromMessageStatement.name,
          session,
          account.id
        );

        const {
          type,
          eventCondition,
          from,
          fromSpecificMessage,
          happenCondition,
          time,
          tag,
        } = statement;

        const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];
        const workspaceIdCondition = `workspace_id = '${workspace.id}'`;
        //to do change clickhouse?
        //const workspaceIdCondition = `userId = '${workspace.id}'`;
        //console.log('statement is', statement);

        let journeyIds = [];

        if (from.key === 'ANY') {
          // Get all journeys associated with the account
          console.log('ji any');
          journeyIds = await this.getJourneys(account, session);
        } else if (from.key === 'WITH_TAG') {
          // Get all journeys with the specific tag
          console.log('ji with tag');
          journeyIds = await this.getJourneysWithTag(account, session, tag);
        }

        console.log('THe journey ids are', journeyIds);

        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();

        const stepIds = [];

        try {
          for (const journeyId of journeyIds) {
            const steps =
              await this.stepsService.transactionalfindAllByTypeInJourney(
                account,
                StepType.MESSAGE,
                journeyId,
                queryRunner,
                session
              );
            stepIds.push(...steps.map((step) => step.id));
          }
        } catch (error) {
          this.error(error, this.customersFromMessageStatement.name, session);
          throw error;
        } finally {
          await queryRunner.release();
        }

        console.log('step ids are,', JSON.stringify(stepIds, null, 2));

        const userIdCondition = `userId = '${userId}'`;
        let sqlQuery = `SELECT customerId FROM ${ClickHouseTable.MESSAGE_STATUS} WHERE `;

        if (
          type === 'Email' ||
          type === 'Push' ||
          type === 'SMS' ||
          type === 'In-App' ||
          type === 'Webhook'
        ) {
          //wasn;t really sure why this was here before
          /*
        if (from.key !== 'ANY') {
          sqlQuery += `stepId = '${fromSpecificMessage.key}' AND `;
        }
        */

          // Update SQL query based on step IDs case 1, 2
          if (stepIds.length > 0) {
            //console.log("in step ids > 0");
            // Assuming stepIds are unique and need to be included in the SQL query
            const stepIdCondition = `stepId IN (${stepIds
              .map((id) => `'${id}'`)
              .join(', ')})`;
            sqlQuery += `${stepIdCondition} AND `;
          }

          //to do: add support for any and for tags

          switch (eventCondition) {
            case 'received':
              //if it hasnt been sent it cant be opened or clicked
              if (happenCondition === 'has not') {
                sqlQuery += `event != 'sent' AND `;
                sqlQuery += `event != 'opened' AND `;
                sqlQuery += `event != 'clicked' AND `;
              } else {
                sqlQuery += `event = 'sent' AND `;
              }
              break;
            case 'opened':
              if (happenCondition === 'has not') {
                sqlQuery += `event != 'opened' AND `;
                //sqlQuery += `event != 'clicked' AND `;
              } else {
                sqlQuery += `event = 'opened' AND `;
              }
              break;
            case 'clicked':
              if (happenCondition === 'has not') {
                sqlQuery += `event != 'clicked' AND `;
              } else {
                sqlQuery += `event = 'clicked' AND `;
              }
              break;
          }
          sqlQuery += `${workspaceIdCondition} `;

          //during
          if (
            time &&
            time.comparisonType === 'during' &&
            time.timeAfter &&
            time.timeBefore
          ) {
            const timeAfter = new Date(time.timeAfter).toISOString();
            const timeBefore = new Date(time.timeBefore).toISOString();
            const formattedTimeBefore = timeBefore.split('.')[0]; // Remove milliseconds if not supported by ClickHouse
            const formattedTimeAfter = timeAfter.split('.')[0]; // Remove milliseconds if not supported by ClickHouse
            sqlQuery += `AND createdAt >= '${formattedTimeAfter}' AND createdAt <= '${formattedTimeBefore}' `;
          } else if (
            time &&
            time.comparisonType === 'before' &&
            time.timeBefore
          ) {
            const timeBefore = new Date(time.timeBefore).toISOString();
            const formattedTimeBefore = timeBefore.split('.')[0];
            sqlQuery += `AND createdAt <= '${formattedTimeBefore}' `;
          } else if (
            time &&
            time.comparisonType === 'after' &&
            time.timeAfter
          ) {
            const timeAfter = new Date(time.timeAfter).toISOString();
            const formattedTimeAfter = timeAfter.split('.')[0];
            sqlQuery += `AND createdAt >= '${timeAfter}' `;
          }

          this.debug(
            `the final SQL query is:\n${sqlQuery}`,
            this.customersFromMessageStatement.name,
            session,
            account.id
          );

          const countEvents = await this.clickhouseClient.query({
            query: sqlQuery,
            format: 'CSV',
            //query_params: { customerId },
          });
          this.debug(
            `creating collection`,
            this.customersFromMessageStatement.name,
            session,
            account.id
          );
          const batchSize = 1000; // Define batch size
          let batch = [];

          // Async function to handle batch insertion
          async function processBatch(batch) {
            try {
            } catch (err) {
              console.error('Error inserting documents:', err);
            }
          }

          const stream = countEvents.stream();

          // to do this needs to be tested on a very large set of customers to check streaming logic is sound

          stream.on('data', async (rows: ClickHouseRow[]) => {
            stream.pause();

            for (const row of rows) {
              const cleanedText = row.text.replace(/^"(.*)"$/, '$1'); // Removes surrounding quotes
              //console.log("cleaned text is", cleanedText);
              //const objectId = new Types.ObjectId(cleanedText);
              const objectId = cleanedText;
              batch.push({ _id: objectId }); // Convert each ObjectId into an object

              if (batch.length >= batchSize) {
                await processBatch(batch);
                batch = []; // Reset batch after insertion
              } else {
                stream.resume(); // Resume the stream if batch size not reached
              }
            }
            // Resume the stream after batch processing
            //stream.resume();

            /*
          rows.forEach((row: ClickHouseRow) => {
            const cleanedText = row.text.replace(/^"(.*)"$/, '$1'); // Removes surrounding quotes
            console.log("cleaned text is", cleanedText);
            const objectId = new Types.ObjectId(cleanedText);
            batch.push({ _id: objectId }); // Convert each ObjectId into an object
            if (batch.length >= batchSize) {
              // Using async function to handle the insertion
              (async () => {
                try {
                  const result = await collectionHandle.insertMany(batch);
                  console.log('Batch of documents inserted:', result);
                  batch = []; // Reset batch after insertion
                } catch (err) {
                  console.error('Error inserting documents:', err);
                }
              })();
            }
          });
          */
          });

          //console.log("batch is", JSON.stringify(batch, null, 2));

          const intermediateCollectionResult = await new Promise((resolve) => {
            stream.on('end', async () => {
              if (batch.length > 0) {
                //console.log("batch is", JSON.stringify(batch, null, 2));

                // Insert any remaining documents
                try {
                  //console.log('Final batch of documents inserted:', result);
                } catch (err) {
                  console.error('Error inserting documents:', err);
                }
              }
              this.debug(
                'Completed!',
                this.customersFromMessageStatement.name,
                session,
                account.id
              );

              //console.log("intermediate collection is", intermediateCollection );
              //const documents = await collectionHandle.find({}).toArray();
              //  documents.forEach(doc => console.log(doc));
              //console.log("finished print items in", intermediateCollection );

              //return intermediateCollection;

              resolve(intermediateCollection);
            });
          });

          return intermediateCollectionResult;

          /*
        this.debug(
          `set from custoners from messages is:\n${customerIds}`,
          this.customersFromMessageStatement.name,
          session,
          account.id
        );
        return customerIds;
        */
        }
        //to do: check what we should do in this case
        //throw "Invalid statement type";
        return intermediateCollection;

        //return false;
      }
    );
  }

  correctValueType(
    valueType: string,
    value: any,
    account: Account,
    session: string
  ) {
    switch (valueType) {
      case 'Number':
        // Convert to a number
        return Number(value);
      case 'String':
        // Already a string, no conversion needed
        return value;
      case 'Boolean':
        // Convert to boolean
        return String(value).toLowerCase() === 'true';
      case 'Date':
        // Convert to a date
        return new Date(value);
      case 'Datetime':
        // Convert to a datetime
        return new Date(value);
      case 'Object':
        try {
          // Attempt to parse as JSON object
          return JSON.parse(value);
        } catch (e) {
          this.debug(
            'Error parsing object\n',
            this.correctValueType.name,
            session,
            account.id
          );
          return null;
        }
      default:
        this.debug(
          `Invalid type: ${valueType}\n`,
          this.correctValueType.name,
          session,
          account.id
        );

        return value;
    }
  }

  // Helper function to parse relative dates
  parseRelativeDate(value: string): Date {
    //console.log("in parseRelativeDate");
    const parts = value.split(' ');
    let date = new Date();
    const number = parseInt(parts[0], 10);
    const unit = parts[1] as 'days' | 'weeks' | 'months' | 'years';
    const direction = parts[2];

    if (direction === 'ago') {
      date = sub(date, { [unit]: number });
    } else if (direction === 'from-now') {
      date = add(date, { [unit]: number });
    }

    //console.log("parsed date is", JSON.stringify(date, null, 2));

    return date;
  }

  // Convert to MongoDB date format
  toMongoDate(date: Date): string {
    return formatISO(date, { representation: 'date' });
  }

  /**
   * Gets set of customers from a single statement that
   * includes Attribute,
   *
   *  eg firstName equal to Abe
   *
   * Handles SINGLE statements not queries with subqueries
   *
   * @returns set of customers
   */
  async customersFromAttributeStatement(
    statement: any,
    account: Account,
    session: string,
    count: number,
    intermediateCollection: string
  ) {
    return Sentry.startSpan(
      { name: 'CustomersService.customersFromAttributeStatement' },
      async () => {
        const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

        //console.log('generating attribute mongo query');
        this.debug(
          'generating attribute mongo query\n',
          this.customersFromAttributeStatement.name,
          session,
          account.id
        );
        const {
          key,
          comparisonType,
          subComparisonType,
          value,
          valueType,
          subComparisonValue,
          dateComparisonType,
        } = statement;
        const query: any = {
          workspaceId: workspace.id,
        };

        this.debug(
          `key is: ${key}`,
          this.customersFromAttributeStatement.name,
          session,
          account.id
        );

        this.debug(
          `comparison type is: ${comparisonType}`,
          this.customersFromAttributeStatement.name,
          session,
          account.id
        );

        this.debug(
          `value is: ${value}`,
          this.customersFromAttributeStatement.name,
          session,
          account.id
        );

        this.debug(
          `value type is: ${typeof value}`,
          this.customersFromAttributeStatement.name,
          session,
          account.id
        );

        switch (comparisonType) {
          case 'is equal to':
            //checked
            query[key] = this.correctValueType(
              valueType,
              value,
              account,
              session
            );
            break;
          case 'is not equal to':
            //checked
            query[key] = {
              $ne: this.correctValueType(valueType, value, account, session),
            };
            break;
          case 'contains':
            // doesnt seem to be working
            query[key] = { $regex: new RegExp(value, 'i') };
            break;
          case 'does not contain':
            // doesnt seem to be working
            query[key] = { $not: new RegExp(value, 'i') };
            break;
          case 'exist':
            //checked
            query[key] = { $exists: true };
            break;
          case 'not exist':
            //checked
            query[key] = { $exists: false };
            break;
          case 'is greater than':
            query[key] = {
              $gt: this.correctValueType(valueType, value, account, session),
            };
            break;
          case 'is less than':
            query[key] = {
              $lt: this.correctValueType(valueType, value, account, session),
            };
            break;
          // nested object
          case 'key':
            if (subComparisonType === 'equal to') {
              query[key] = { [value]: subComparisonValue };
            } else if (subComparisonType === 'not equal to') {
              query[key] = { [value]: { $ne: subComparisonValue } };
            } else if (subComparisonType === 'exist') {
              query[key] = { [value]: { $exists: true } };
            } else if (subComparisonType === 'not exist') {
              query[key] = { [value]: { $exists: false } };
            } else {
              throw new Error(
                'Invalid sub-comparison type for nested property'
              );
            }
            break;
          case 'after':
            //console.log("value type is", typeof value);
            //console.log("value is", value);
            let afterDate: Date;
            let isoDateStringAfter: string;
            if (valueType === 'Date' && dateComparisonType === 'relative') {
              afterDate = this.parseRelativeDate(value);
              isoDateStringAfter = afterDate.toISOString();
            } else {
              // Use the Date constructor for parsing RFC 2822 formatted dates
              afterDate = new Date(value);
              isoDateStringAfter = afterDate.toISOString();
            }
            //console.log("afterDate type is", typeof afterDate);
            //console.log("after date is", afterDate);
            // Check if afterDate is valid
            if (isNaN(afterDate.getTime())) {
              throw new Error('Invalid date format');
            }
            //query[key] = { $gt: afterDate };
            query[key] = { $gt: isoDateStringAfter };
            break;
          case 'before':
            //console.log("value type is", typeof value);
            //console.log("value is", value);
            let beforeDate: Date;
            let isoDateStringBefore: string;
            if (valueType === 'Date' && dateComparisonType === 'relative') {
              beforeDate = this.parseRelativeDate(value);
              isoDateStringBefore = beforeDate.toISOString();
            } else {
              // Directly use the Date constructor for parsing RFC 2822 formatted dates
              beforeDate = new Date(value);
              isoDateStringBefore = beforeDate.toISOString();
            }
            //console.log("beforeDate type is", typeof beforeDate);
            //console.log("before date is", beforeDate);
            // Check if beforeDate is valid
            if (isNaN(beforeDate.getTime())) {
              throw new Error('Invalid date format');
            }
            //query[key] = { $lt: this.toMongoDate(beforeDate) };
            //query[key] = { $lt: beforeDate };
            query[key] = { $lt: isoDateStringBefore };
            break;
          case 'during':
            //console.log("value type is", typeof value);
            //console.log("value is", value);
            //console.log("subComparisonValue is", subComparisonValue);
            let startDate: Date, endDate: Date;
            let isoStart: string, isoEnd: string;
            if (valueType === 'Date' && dateComparisonType === 'relative') {
              startDate = this.parseRelativeDate(value);
              endDate = this.parseRelativeDate(subComparisonValue);
              isoStart = startDate.toISOString();
              isoEnd = endDate.toISOString();
            } else {
              // Use the Date constructor for parsing RFC 2822 formatted dates
              startDate = new Date(value);
              endDate = new Date(subComparisonValue);
              isoStart = startDate.toISOString();
              isoEnd = endDate.toISOString();
            }
            //console.log("startDate type is", typeof startDate);
            //console.log("startDate is", startDate);
            //console.log("endDate type is", typeof endDate);
            //console.log("endDate is", endDate);
            // Check if dates are valid
            if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
              throw new Error('Invalid date format');
            }
            //query[key] = { $gte: startDate, $lte: endDate };
            query[key] = { $gte: isoStart, $lte: isoEnd };
            break;
          // Add more cases for other comparison types as needed
          default:
            throw new Error('Invalid comparison type');
        }

        this.debug(
          ` generated attribute query is: ${JSON.stringify(query, null, 2)}`,
          this.customersFromAttributeStatement.name,
          session,
          account.id
        );

        this.debug(
          'now grabbing customers with the query',
          this.customersFromAttributeStatement.name,
          session,
          account.id
        );

        this.debug(
          'in the aggregate construction - attribute',
          this.customersFromAttributeStatement.name,
          session,
          account.id
        );

        this.debug(
          `creating collection`,
          this.customersFromAttributeStatement.name,
          session,
          account.id
        );


        const aggregationPipeline: any[] = [
          { $match: query },
          {
            $project: {
              //customerId: "$_id", // or another field that uniquely identifies the customer
              //_id: 0 // Optionally exclude the default _id if it's not needed
              _id: 1,
            },
          },
          { $out: intermediateCollection },
        ];
        return intermediateCollection;
        /*
      const correlationValues = new Set<string>();

      docs.forEach((custData) => {
        correlationValues.add(custData._id.toString());
      });

      this.debug(
        `Here are the correlationValues: ${correlationValues}`,
        this.customersFromAttributeStatement.name,
        session,
        account.id
      );

      return correlationValues;
      */
      }
    );
  }

  /**
   * Gets the primary key for a given user
   *
   * @returns string
   */
  async getPrimaryKey(account: Account, session: string): Promise<string> {
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    const customerKeyDocument = await this.customerKeysService.getPrimaryKey(workspace.id, session);

    if (customerKeyDocument) {
      const currentPK = customerKeyDocument.name;

      this.debug(
        `current pk is: ${currentPK}`,
        this.getPrimaryKey.name,
        session,
        account.id
      );
      return currentPK;
    } else {
      // Handle case where currentPK is null
      this.debug(
        `pk isnt working so set as email`,
        this.getPrimaryKey.name,
        session,
        account.id
      );
      //to do just for testing
      //currentPK = 'email';
      //return currentPK;
      return 'email';
    }
  }

  /**
   * Gets the primary key for a given user
   *
   * @returns string
   */
  async getPrimaryKeyStrict(
    workspaceId: string,
    session: string
  ): Promise<CustomerKey> {
    let primaryKey: CustomerKey =
      await this.cacheService.getIgnoreError(
        CacheConstants.PRIMARY_KEYS,
        workspaceId,
        async () => {
          return await this.customerKeysService.getPrimaryKey(workspaceId, session);
          ;
        }
      );

    return primaryKey;
  }

  /**
   * Gets set of customers from a single statement that
   * includes Events,
   *
   *  eg onboarding has performed 1 times
   *
   * Handles SINGLE statements not queries with subqueries
   * 
   * eg:
   * 
   * {
      "type": "Event",
      "comparisonType": "has performed",
      "eventName": "Event_View",
      "value": 1,
      "time": {
        "comparisonType": "before",
        "timeBefore": "1 days ago",
        "dateComparisonType": "relative",
        "timeAfter": "1 days ago"
      },
      "additionalProperties": {
        "comparison": "all",
        "properties": []
      }
    }
   *
   *
   * @returns set of customers
   */
  async customersFromEventStatement(
    statement: any,
    account: Account,
    session: string,
    count: number,
    intermediateCollection: string
  ) {
    return Sentry.startSpan(
      { name: 'CustomersService.customersFromEventStatement' },
      async () => {
        const { eventName, comparisonType, value, time, additionalProperties } =
          statement;

        const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

        const mongoQuery: any = {
          event: eventName,
          workspaceId: workspace.id,
        };

        if (time) {
          const { dateComparisonType, timeAfter, timeBefore } = time;
          switch (time.comparisonType) {
            case 'after':
              let afterDate: Date;
              let isoDateStringAfter: string;
              if (dateComparisonType === 'relative') {
                afterDate = this.parseRelativeDate(timeAfter);
                isoDateStringAfter = afterDate.toISOString();
              } else {
                afterDate = new Date(timeAfter);
                isoDateStringAfter = afterDate.toISOString();
              }
              if (isNaN(afterDate.getTime())) {
                throw new Error('Invalid date format');
              }
              mongoQuery.createdAt = { $gt: isoDateStringAfter };
              break;
            case 'before':
              let beforeDate: Date;
              let isoDateStringBefore: string;
              if (dateComparisonType === 'relative') {
                beforeDate = this.parseRelativeDate(timeBefore);
                isoDateStringBefore = beforeDate.toISOString();
              } else {
                beforeDate = new Date(timeBefore);
                isoDateStringBefore = beforeDate.toISOString();
              }
              if (isNaN(beforeDate.getTime())) {
                throw new Error('Invalid date format');
              }
              mongoQuery.createdAt = { $lt: isoDateStringBefore };
              break;
            case 'during':
              let startDate: Date, endDate: Date;
              let isoStart: string, isoEnd: string;
              if (dateComparisonType === 'relative') {
                startDate = this.parseRelativeDate(timeAfter);
                endDate = this.parseRelativeDate(timeBefore);
                isoStart = startDate.toISOString();
                isoEnd = endDate.toISOString();
              } else {
                startDate = new Date(timeAfter);
                endDate = new Date(timeBefore);
                isoStart = startDate.toISOString();
                isoEnd = endDate.toISOString();
              }
              if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
                throw new Error('Invalid date format');
              }
              mongoQuery.createdAt = { $gte: isoStart, $lte: isoEnd };
              break;
          }
        }

        //sub property not fully tested yet
        if (additionalProperties) {
          const propertiesQuery: any[] = [];
          for (const property of additionalProperties.properties) {
            const propQuery: any = {};
            propQuery[`payload.${property.key}`] =
              this.getValueComparison(property);
            propertiesQuery.push(propQuery);
          }

          if (additionalProperties.comparison === 'all') {
            if (propertiesQuery.length > 0) {
              mongoQuery.$and = propertiesQuery;
            }
          } else if (additionalProperties.comparison === 'any') {
            if (propertiesQuery.length > 0) {
              mongoQuery.$or = propertiesQuery;
            }
          }
        }


        if (comparisonType === 'has performed') {
          const aggregationPipeline: any[] = [
            { $match: mongoQuery },
            {
              $lookup: {
                from: 'customers',
                localField: 'correlationValue',
                foreignField: await this.getPrimaryKey(account, session),
                as: 'matchedCustomers',
              },
            },
            { $unwind: '$matchedCustomers' },
            {
              $group: {
                _id: '$matchedCustomers._id',
                count: { $sum: 1 },
              },
            },
            { $match: { count: { $gte: value } } },
            { $out: intermediateCollection },
          ];

          const result: any =
            await this.eventsService.getCustomersbyEventsMongo(
              aggregationPipeline
            );

          mongoQuery.source = 'mobile';

          let aggregationPipelineMobile: any[] = [
            { $match: mongoQuery },
            {
              $addFields: {
                convertedCorrelationValue: '$correlationValue',
              },
            },
            {
              $lookup: {
                from: 'customers',
                localField: 'convertedCorrelationValue',
                foreignField: '_id',
                as: 'matchedCustomers',
              },
            },
            { $unwind: '$matchedCustomers' },
            {
              $group: {
                _id: '$matchedCustomers._id',
                count: { $sum: 1 },
              },
            },
            { $match: { count: { $gte: value } } },
          ];
          if (process.env.DOCUMENT_DB === 'true') {
            aggregationPipelineMobile.push({
              $merge: {
                into: 'events_test_col', //intermediateCollection, // specify the target collection name
                on: '_id', // assuming '_id' is your unique identifier
                whenMatched: 'keepExisting', // prevents updates to existing documents; consider "keepExisting" if you prefer not to error out
                whenNotMatched: 'insert', // inserts the document if no match is found
              },
            });
          } else {
            aggregationPipelineMobile.push({
              $merge: {
                into: intermediateCollection, // specify the target collection name
                on: '_id', // assuming '_id' is your unique identifier
                whenMatched: 'keepExisting', // prevents updates to existing documents; consider "keepExisting" if you prefer not to error out
                whenNotMatched: 'insert', // inserts the document if no match is found
              },
            });
          }

          const mobileResult: any =
            await this.eventsService.getCustomersbyEventsMongo(
              aggregationPipelineMobile
            );

          const aggregationPipelineMobileOtherIds: any[] = [
            { $match: mongoQuery },
            {
              $lookup: {
                from: 'customers',
                localField: 'correlationValue',
                foreignField: 'other_ids',
                as: 'matchedCustomersFromOtherIds',
              },
            },
            { $unwind: '$matchedCustomersFromOtherIds' },
            {
              $group: {
                _id: '$matchedCustomersFromOtherIds._id',
                count: { $sum: 1 },
              },
            },
            { $match: { count: { $gte: value } } }, // Replace `value` with the minimum count of matches you want
            {
              $merge: {
                into: intermediateCollection, // Specify the same intermediateCollection name as the first pipeline
                on: '_id', // Merge on the `_id` field
                whenMatched: 'keepExisting', // You could choose another option like 'replace', 'merge', or 'fail' based on your requirements
                whenNotMatched: 'insert', // Insert if the _id was not matched (new entry)
              },
            },
          ];

          //fetch users here
          const mobileResultOtherIds: any =
            await this.eventsService.getCustomersbyEventsMongo(
              aggregationPipelineMobileOtherIds
            );

          return intermediateCollection;
        } else if (comparisonType === 'has not performed') {
          //first check
          const checkEventExists = [
            {
              $match: mongoQuery,
            },
            {
              $group: {
                _id: '$event',
                count: { $sum: 1 },
              },
            },
          ];
          const check = await this.eventsService.getCustomersbyEventsMongo(
            checkEventExists
          );

          if (check.length < 1) {
            const allUsers = [
              {
                $match: {
                  workspaceId: workspace.id,
                },
              },
              {
                $project: {
                  _id: 1,
                },
              },
              { $out: intermediateCollection },
            ];

            return intermediateCollection;
          }

          const primaryKey = await this.getPrimaryKey(account, session); // Ensure this is done outside the pipeline

          const pipeline1 = [
            { $match: mongoQuery },
            {
              $lookup: {
                from: 'customers',
                localField: 'correlationValue',
                foreignField: primaryKey,
                as: 'matchedCustomers',
              },
            },
            { $unwind: '$matchedCustomers' },
            {
              $project: {
                _id: '$matchedCustomers._id', // Projects the _id of the matched customers
              },
            },
            { $out: intermediateCollection },
          ];

          const result = await this.eventsService.getCustomersbyEventsMongo(
            pipeline1
          );

          const mobileMongoQuery = cloneDeep(mongoQuery);
          mobileMongoQuery.source = 'mobile';

          const pipeline2 = [
            { $match: mobileMongoQuery },
            {
              $addFields: {
                convertedCorrelationValue: '$correlationValue',
              },
            },
            {
              $lookup: {
                from: 'customers',
                localField: 'convertedCorrelationValue',
                foreignField: '_id',
                as: 'matchedOnCorrelationValue',
              },
            },
            { $unwind: '$matchedOnCorrelationValue' },
            {
              $project: {
                _id: '$matchedOnCorrelationValue._id', // Projects the _id of the matched customers
              },
            },
            {
              $merge: {
                into: intermediateCollection,
                on: '_id',
                whenMatched: 'keepExisting',
                whenNotMatched: 'insert',
              },
            },
          ];

          const result2 = await this.eventsService.getCustomersbyEventsMongo(
            pipeline2
          );

          const pipeline3 = [
            {
              $lookup: {
                from: intermediateCollection,
                localField: '_id',
                foreignField: '_id',
                as: 'matchedInIntermediate',
              },
            },
            {
              $match: {
                matchedInIntermediate: { $size: 0 },
              },
            },
            {
              $project: {
                _id: 1,
              },
            },
            { $out: intermediateCollection },
          ];
          return intermediateCollection;
        } else {
          return intermediateCollection;
        }
        return intermediateCollection;
        //return false;
      }
    );
  }

  /*
   * Checks if a given customer should be in a segment
   * returns a boolean
   * 
   * @param customer 
   eg 
    {
      "_id": {
        "$oid": "657619ac0cd6aa53b5910962"
      },
      "firstName": "A",
      "lastName": "B",
      "email": "abe@example.com",
      "workflows": [],
      "journeys": [
        "12624e62-367e-483b-9ddf-38160f4fd955"
      ],
      "ownerId": "c65069d2-ef33-427b-b093-6dd5870c4c33",
      "posthogId": [],
      "slackTeamId": [],
      "verified": true,
      "__v": 0,
      "journeyEnrollmentsDates": {
        "12624e62-367e-483b-9ddf-38160f4fd955": "Sun, 10 Dec 2023 23:15:14 GMT"
      }
    }
   * @param query eg 
    "query": {
    "type": "all",
    "statements": [
      {
        "type": "Attribute",
        "key": "something",
        "comparisonType": "is equal to",
        "subComparisonType": "exist",
        "subComparisonValue": "",
        "valueType": "String",
        "value": "another thing"
      },
      {
        "type": "Attribute",
        "key": "firstName",
        "comparisonType": "is equal to",
        "subComparisonType": "exist",
        "subComparisonValue": "",
        "valueType": "String",
        "value": "s"
      },
      {
        "type": "Attribute",
        "key": "lastName",
        "comparisonType": "is equal to",
        "subComparisonType": "exist",
        "subComparisonValue": "",
        "valueType": "String",
        "value": "f"
      },
      {
        "type": "any",
        "statements": [
    {
      "type": "Attribute",
      "key": "lastName",
      "comparisonType": "is equal to",
      "subComparisonType": "exist",
      "subComparisonValue": "",
      "valueType": "String",
      "value": "g"
    }
        ],
        "isSubBuilderChild": true
      }
    ]
    }
   */
  //ref func
  async checkCustomerMatchesQuery(
    query: any,
    account: Account,
    session: string,
    customer?: Customer,
    customerId?: string,
    options?: QueryOptions
    //customerKeys?: { key: string, type: AttributeType }[]
  ) {
    this.debug(
      'in checkCustomerMatchesQuery',
      this.checkCustomerMatchesQuery.name,
      session,
      account.id
    );
    if (!customerId && !customer) {
      throw new Error(
        "At least one of 'customerId' or 'customer' must be provided."
      );
    }
    if (customerId && !customer) {
      // If customerId is provided but customer is not
      customer = await this.findByCustomerId(account, customerId);
      // customer = await this.CustomerModel.findOne({
      //   _id: new Types.ObjectId(customerId),
      //   ownerId: account.id,
      // }).exec();
      if (!customer) throw new Error('Person not found');
    }
    if (query.type === 'all') {
      // 'all' logic: All conditions must be satisfied
      if (!query.statements || query.statements.length === 0) {
        // If no statements are provided, return false
        return false;
      }
      //return query.statements.every(async (statement) => (await this.evaluateStatementWithSubQuery(customer, statement , account)));
      const results = await Promise.all(
        query.statements.map(async (statement) => {
          return await this.evaluateStatementWithSubQuery(
            customer,
            statement,
            account,
            session
          );
        })
      );
      return results.every((result) => result);
    } else if (query.type === 'any') {
      // 'any' logic: At least one condition must be satisfied
      if (!query.statements || query.statements.length === 0) {
        // If no statements are provided, return true
        return true;
      }
      //return query.statements.some(async (statement) => (await this.evaluateStatementWithSubQuery(customer, statement, account)));
      const results = await Promise.all(
        query.statements.map(async (statement) => {
          return await this.evaluateStatementWithSubQuery(
            customer,
            statement,
            account,
            session
          );
        })
      );
      return results.some((result) => result);
    } else {
    }
    return false;
  }

  async evaluateStatementWithSubQuery(
    customer: Customer,
    statement: any,
    account: Account,
    session: string,
    options?: QueryOptions
  ): Promise<boolean> {
    if (statement.statements && statement.statements.length > 0) {
      // Statement has a subquery, recursively evaluate the subquery
      return this.checkCustomerMatchesQuery(
        statement,
        account,
        session,
        customer
      );
    } else {
      return await this.evaluateSingleStatement(
        customer,
        statement,
        account,
        session
      );
    }
  }

  /**
   * Evaluates if a customer should be included according to the single statement provided
   * @returns a boolean in promise
   *
   * @param takes in a single statement, NOT a query.
   *   single statments do not include 'all' or 'any' for types
   * @param customer
   *
   */
  async evaluateSingleStatement(
    customer: Customer,
    statement: any,
    account: Account,
    session: string
  ): Promise<boolean> {
    const {
      key,
      type,
      comparisonType,
      subComparisonType,
      value,
      subComparisonValue,
    } = statement;

    switch (type) {
      case 'Attribute':
        return this.evaluateAttributeStatement(
          customer,
          statement,
          account,
          session
        );
      case 'Event':
        return await this.evaluateEventStatement(
          customer,
          statement,
          account,
          session
        );
      case 'Email':
        return this.evaluateMessageStatement(
          customer,
          statement,
          account,
          'Email',
          session
        );
      case 'Push':
        return this.evaluateMessageStatement(
          customer,
          statement,
          account,
          'Push',
          session
        );
      case 'SMS':
        return this.evaluateMessageStatement(
          customer,
          statement,
          account,
          'SMS',
          session
        );
      case 'In-app message':
        return this.evaluateMessageStatement(
          customer,
          statement,
          account,
          'In-app message',
          session
        );
      case 'Segment':
        break;
      default:
        throw new Error('Invalid comparison type');
    }
  }

  getValueComparison(property: any): any {
    switch (property.subComparisonType) {
      case 'is equal to':
        return property.value;
      case 'is not equal to':
        return { $ne: property.value };
      case 'contains':
        if (typeof property.value === 'string') {
          return { $regex: new RegExp(property.value, 'i') };
        }
        return null;
      case 'does not contain':
        if (typeof property.value === 'string') {
          return { $not: { $regex: new RegExp(property.value, 'i') } };
        }
        return null;
      case 'exist':
        return { $exists: true };
      case 'not exist':
        return { $exists: false };
      case 'is greater than':
        if (typeof property.value === 'number') {
          return { $gt: property.value };
        }
        return null;
      case 'is less than':
        if (typeof property.value === 'number') {
          return { $lt: property.value };
        }
        return null;
      // Add more comparison cases as needed
      default:
        return null;
    }
  }

  /**
   * Evaluates if a customer should be included according to the single  Message statement provided
   * @returns a boolean in promise
   *
   * @param takes in a single message statement, NOT a query.
   *   single statments do not include 'all' or 'any' for types
   *    eg email from journey a, email 1 has been received
   * @param customer
   *
   */
  async evaluateMessageStatement(
    customer: Customer,
    statement: any,
    account: Account,
    typeOfMessage: string,
    session: string
  ): Promise<boolean> {
    const userId = (<Account>account).id;

    const {
      type,
      eventCondition,
      from,
      fromSpecificMessage,
      happenCondition,
      time,
    } = statement;
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];
    const workspaceIdCondition = `workspace_id = '${workspace.id}'`;
    //to do change clickhouse?
    //const workspaceIdCondition = `userId = '${workspace.id}'`;
    let sqlQuery = `SELECT COUNT(*) FROM ${ClickHouseTable.MESSAGE_STATUS} WHERE `;
    //let sqlQuery = `SELECT * FROM ${ClickHouseTable.MESSAGE_STATUS} WHERE `;

    if (
      type === 'Email' ||
      type === 'Push' ||
      type === 'SMS' ||
      type === 'In-App' ||
      type === 'Webhook'
    ) {
      if (from.key !== 'ANY') {
        sqlQuery += `stepId = '${fromSpecificMessage.key}' AND `;
        //sqlQuery += `fromTitle = '${from.title}' AND `;
      }

      //to do: add support for any and for tags

      switch (eventCondition) {
        case 'received':
          //if it hasnt been sent it cant be opened or clicked
          if (happenCondition === 'has not') {
            sqlQuery += `event != 'sent' AND `;
            sqlQuery += `event != 'opened' AND `;
            sqlQuery += `event != 'clicked' AND `;
          } else {
            sqlQuery += `event = 'sent' AND `;
          }
          break;
        case 'opened':
          if (happenCondition === 'has not') {
            sqlQuery += `event != 'opened' AND `;
            //sqlQuery += `event != 'clicked' AND `;
          } else {
            sqlQuery += `event = 'opened' AND `;
          }
          break;
        case 'clicked':
          if (happenCondition === 'has not') {
            sqlQuery += `event != 'clicked' AND `;
          } else {
            sqlQuery += `event = 'clicked' AND `;
          }
          break;
      }
      sqlQuery += `${workspaceIdCondition} `;

      //during
      if (
        time &&
        time.comparisonType === 'during' &&
        time.timeAfter &&
        time.timeBefore
      ) {
        const timeAfter = new Date(time.timeAfter).toISOString();
        const timeBefore = new Date(time.timeBefore).toISOString();
        const formattedTimeBefore = timeBefore.split('.')[0]; // Remove milliseconds if not supported by ClickHouse
        const formattedTimeAfter = timeAfter.split('.')[0]; // Remove milliseconds if not supported by ClickHouse
        sqlQuery += `AND createdAt >= '${formattedTimeAfter}' AND createdAt <= '${formattedTimeBefore}' `;
      } else if (time && time.comparisonType === 'before' && time.timeBefore) {
        const timeBefore = new Date(time.timeBefore).toISOString();
        const formattedTimeBefore = timeBefore.split('.')[0];
        sqlQuery += `AND createdAt <= '${formattedTimeBefore}' `;
      } else if (time && time.comparisonType === 'after' && time.timeAfter) {
        const timeAfter = new Date(time.timeAfter).toISOString();
        const formattedTimeAfter = timeAfter.split('.')[0];
        sqlQuery += `AND createdAt >= '${formattedTimeAfter}' `;
      }
      this.debug(
        `the final SQL query is:\n ${sqlQuery}`,
        this.evaluateMessageStatement.name,
        session,
        account.id
      );

      //const testQuery = "SELECT COUNT(*) FROM ${ClickHouseTable.MESSAGE_STATUS}" ;
      const countEvents = await this.clickhouseClient.query({
        query: sqlQuery,
        format: 'CSV',
        //query_params: { customerId },
      });

      let countOfEvents = '0';
      const stream = countEvents.stream();
      stream.on('data', (rows: ClickHouseRow[]) => {
        rows.forEach((row: ClickHouseRow) => {
          //console.log('this is the data', row.text);
          countOfEvents = row.text;
        });
      });
      await new Promise((resolve) => {
        stream.on('end', () => {
          //console.log('Completed!');
          this.debug(
            'Completed!',
            this.evaluateMessageStatement.name,
            session,
            account.id
          );
          resolve(0);
        });
      });

      const numericValue = Number(countOfEvents);
      return numericValue > 0 ? true : false;
    }
    //to do: check what we should do in this case
    //throw "Invalid statement type";
    return false;
  }

  /*
   * this needs to be rejigged a little the mongo query takes in a customer field to filter against
   * something like: mongoQuery[correlationKey] = correlationValue

   */
  /**
   * Evaluates if a customer should be included according to the single Event statement provided
   * @returns a boolean in promise
   *
   * @param takes in a single Event statement, NOT a query.
   *   single statments do not include 'all' or 'any' for types
   *    eg onboarding has performed 1 times
   * @param customer
   *
   */
  async evaluateEventStatement(
    customer: Customer,
    statement: any,
    account: Account,
    session: string
  ): Promise<boolean> {
    const { eventName, comparisonType, value, time, additionalProperties } =
      statement;

    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    let whereClauses = [
      `event = '${eventName}'`,
      `workspace_id = '${workspace.id}'`
    ];

    const currentPK = await this.customerKeysService.getPrimaryKey(workspace.id, session);

    if (currentPK && customer[currentPK.name]) {
      whereClauses.push(`(correlation_key = '${currentPK}' AND correlation_value = '${customer[currentPK.name]}')`);
    } else {
      // Handle case where currentPK is null
      //uncomment when primary key thing is working correctly
      /*
      throw new HttpException(
        "Select a primary key first.",
        HttpStatus.BAD_REQUEST
      );
      */
    }

    // Add the condition for the mobile SDK
    // whereClauses.push(`(correlation_key = 'uuid' AND correlation_value = '${customer.uuid}')`);

    if (time) {
      switch (time.comparisonType) {
        case 'before':
          whereClauses.push(`createdAt < '${new Date(time.timeBefore).toISOString()}'`);
          break;
        case 'after':
          whereClauses.push(`createdAt > '${new Date(time.timeAfter).toISOString()}'`);
          break;
        case 'during':
          whereClauses.push(`createdAt BETWEEN '${new Date(time.timeAfter).toISOString()}' AND '${new Date(time.timeBefore).toISOString()}'`);
          break;
        default:
          break;
      }
    }

    if (additionalProperties) {
      const propertiesQuery: string[] = [];
      for (const property of additionalProperties.properties) {
        const propQuery = `payload.${property.key} ${this.getValueComparison(property)}`;
        propertiesQuery.push(propQuery);
      }

      if (additionalProperties.comparison === 'all') {
        if (propertiesQuery.length > 0) {
          whereClauses.push(propertiesQuery.join(' AND '));
        }
      } else if (additionalProperties.comparison === 'any') {
        if (propertiesQuery.length > 0) {
          whereClauses.push(`(${propertiesQuery.join(' OR ')})`);
        }
      }
    }

    const whereClause = whereClauses.join(' AND ');
    const query = `SELECT count(*) as count FROM events WHERE ${whereClause};`;
    const result = await this.clickhouseClient.query({ query });

    const count = +(await result.json<{ count: number }>()).data[0].count;

    if (comparisonType === 'has performed') {
      return count >= value;
    } else if (comparisonType === 'has not performed') {
      return count < 1;
    }
    return false;
  }

  evaluateAttributeStatement(
    customer: Customer,
    statement: any,
    account: Account,
    session: string
  ): boolean {
    //console.log('In evaluateAttributeStatement/n\n');

    this.debug(
      'In evaluateAttributeStatement/n\n',
      this.evaluateAttributeStatement.name,
      session
    );

    const {
      key,
      comparisonType,
      subComparisonType,
      value,
      valueType,
      subComparisonValue,
    } = statement;

    this.debug(
      JSON.stringify(statement, null, 2),
      this.evaluateAttributeStatement.name,
      session
    );

    this.debug(
      `value is: ${value}`,
      this.evaluateAttributeStatement.name,
      session
    );

    this.debug(
      `value type is: ${typeof value}`,
      this.evaluateAttributeStatement.name,
      session
    );

    if (!(key in customer)) {
      /*
      console.log(
        'apparently the customer does not have the key',
        JSON.stringify(customer, null, 2)
      );
      */
      this.debug(
        'apparently the customer does not have the key',
        this.evaluateAttributeStatement.name,
        session
      );
      this.debug(
        JSON.stringify(customer, null, 2),
        this.evaluateAttributeStatement.name,
        session
      );
      return false;
    }

    const customerValue = customer[key];
    //console.log('the customerValue is', customerValue);
    this.debug(
      `the customerValue is: ${customerValue}`,
      this.evaluateAttributeStatement.name,
      session
    );

    this.debug(
      `the customerValue type is: ${typeof customerValue}`,
      this.evaluateAttributeStatement.name,
      session
    );

    // Perform comparison based on comparisonType
    //console.log('comparison type is', comparisonType);
    this.debug(
      `comparison type is: ${comparisonType}`,
      this.evaluateAttributeStatement.name,
      session
    );
    // to do correctValueType - we need customer values to be updated first
    switch (comparisonType) {
      case 'is equal to':
        //not checked
        return (
          customerValue ===
          this.correctValueType(valueType, value, account, session)
        ); //value;
      case 'is not equal to':
        return (
          customerValue !==
          this.correctValueType(valueType, value, account, session)
        ); //value;
      case 'contains':
        if (Array.isArray(customerValue)) {
          return customerValue.includes(value);
        }
        if (typeof customerValue === 'string' && typeof value === 'string') {
          return customerValue.includes(value);
        }
        return false;
      case 'does not contain':
        if (Array.isArray(customerValue)) {
          return !customerValue.includes(value);
        }
        if (typeof customerValue === 'string' && typeof value === 'string') {
          return !customerValue.includes(value);
        }
        return false;
      case 'exist':
        return customerValue !== undefined && customerValue !== null;
      case 'not exist':
        return customerValue === undefined || customerValue === null;
      case 'is greater than':
        //to do check - value methinks is now always a string
        if (typeof customerValue === 'number' && !isNaN(+value)) {
          return (
            customerValue >
            this.correctValueType(valueType, value, account, session)
          ); //value;;
        }
        return false;
      case 'is less than':
        //to do check when
        if (typeof customerValue === 'number' && !isNaN(+value)) {
          return (
            customerValue <
            this.correctValueType(valueType, value, account, session)
          ); //value;;
        }
        return false;
      case 'after':
        return new Date(customerValue) > new Date(value);
      case 'before':
        return new Date(customerValue) < new Date(value);
      case 'during':
        return (
          new Date(customerValue) > new Date(value) &&
          new Date(customerValue) < new Date(subComparisonValue)
        );
      case 'length is greater than':
        if (!customerValue.length || isNaN(+value)) return false;
        return customerValue.length > +value;
      case 'length is less than':
        if (!customerValue.length || isNaN(+value)) return false;
        return customerValue.length < +value;
      case 'length is equal to':
        if (!customerValue.length || isNaN(+value)) return false;
        return customerValue.length === +value;
      //not checked
      // nested object
      case 'key':
        //const customerValue = customer[key];
        if (subComparisonType === 'equal to') {
          if (!(value in customerValue)) {
            return false;
          } else {
            return customerValue[value] === subComparisonValue;
          }
        } else if (subComparisonType === 'not equal to') {
          if (value in customerValue) {
            return false;
          } else {
            return customerValue[value] !== subComparisonValue;
          }
        } else if (subComparisonType === 'exist') {
          if (!(value in customerValue)) {
            return false;
          } else {
            return (
              customerValue[value] !== undefined &&
              customerValue[value] !== null
            );
          }
        } else if (subComparisonType === 'not exist') {
          if (value in customerValue) {
            return true;
          } else {
            return (
              customerValue[value] === undefined ||
              customerValue[value] === null
            );
          }
        } else {
          throw new Error('Invalid sub-comparison type for nested property');
        }
      // Add more cases for other comparison types as needed
      default:
        throw new Error('Invalid comparison type');
    }
  }

  public async searchForTest(
    account: Account,
    session: string,
    take = 100,
    skip = 0,
    search = '',
    isWebhook = false
  ): Promise<{
    data: { id: string; email: string; phone: string;[key: string]: string }[];
    totalPages: number;
  }> {
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    const query: any = { workspaceId: workspace.id };

    const deviceTokenConditions = {
      $or: [
        { androidDeviceToken: { $exists: true, $ne: '' } },
        { iosDeviceToken: { $exists: true, $ne: '' } },
      ],
    };

    const pk = await this.customerKeysService.getPrimaryKey(workspace.id, session);

    if (search) {
      const findRegexp = new RegExp(`.*${search}.*`, 'i');

      const searchConditions = {
        $or: [
          ...(search ? [{ _id: search }] : []),
          //...(isValidObjectId(search) ? [{ _id: search }] : []),
          { email: findRegexp },
          { phone: findRegexp },
          ...(pk ? [{ [pk.name]: findRegexp }] : []),
        ],
      };

      if (!isWebhook) query['$and'] = [deviceTokenConditions, searchConditions];
    } else {
      if (!isWebhook) query['$or'] = deviceTokenConditions['$or'];
    }

    // const totalCustomers = await this.CustomerModel.count(query).exec();
    // const totalPages = Math.ceil(totalCustomers / take) || 1;

    // const customers = await this.CustomerModel.find(query)
    //   .skip(skip)
    //   .limit(take <= 100 ? take : 100)
    //   .lean()
    //   .exec();

    return null;
    // {
    //   data: customers.map((cust) => {
    //     const info: { id: string; email: string; phone: string } = {
    //       id: '',
    //       email: '',
    //       phone: '',
    //     };
    //     info['id'] = cust['_id'].toString();
    //     info['email'] = cust['email']?.toString() || '';
    //     info['phone'] = cust['phone']?.toString() || '';
    //     if (pk?.name) {
    //       info[pk.name] = cust[pk.name]?.toString() || '';
    //     }

    //     return info;
    //   }),
    //   totalPages,
    // };
  }

  formatErrorData(data, errorMessage) {
    return `"${JSON.stringify(data).replace(/"/g, '""')}","${errorMessage}"\n`;
  }

  convertForImport(
    value: string,
    convertTo: string,
    columnName: string,
    dateFormat?: string
  ) {
    let error = '';
    let isError = false;
    let converted;
    if (convertTo === AttributeTypeName.STRING) {
      converted = value ? String(value) : null;
    } else if (convertTo === AttributeTypeName.NUMBER) {
      if (!value) {
        converted = null;
      } else {
        converted = Number(value);
        if (isNaN(converted)) {
          converted = null;
          isError = true;
        }
      }
    } else if (convertTo === AttributeTypeName.BOOLEAN) {
      const trimmedLowerValue = value.trim().toLowerCase();
      converted = acceptableBooleanConvertable.true.includes(trimmedLowerValue)
        ? true
        : acceptableBooleanConvertable.false.includes(trimmedLowerValue)
          ? false
          : null;
    } else if (
      convertTo === AttributeTypeName.DATE ||
      convertTo === AttributeTypeName.DATE_TIME
    ) {
      const parsedDate = dateFormat
        ? datefns.parse(value, dateFormat, new Date())
        : new Date(value);

      if (isValid(parsedDate)) converted = parsedDate;
      else isError = true;
    } else if (convertTo === AttributeTypeName.EMAIL) {
      if (isEmail(value)) {
        converted = String(value);
      } else {
        converted = null;
        isError = true;
      }
    }

    if (isError) {
      error = `Error converting '${value}' in '${columnName}' to type '${convertTo.toString()}'`;
    }

    return { converted, error };
  }

  async countImportPreview(
    account: Account,
    settings: ImportCustomersDTO,
    session: string
  ) {
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    let errorFilePath = '';
    try {
      const fileData = await this.importsRepository.findOneBy({
        account: {
          id: account.id,
        },
        fileKey: settings.fileKey,
      });

      if (!fileData) {
        throw new HttpException(
          'File for analysis is missing, check if you have file uploaded.',
          HttpStatus.BAD_REQUEST
        );
      }

      const clearedMapping: Record<string, MappingParam> = {};
      Object.keys(settings.mapping).forEach((el) => {
        if (
          settings.mapping[el]?.asAttribute &&
          !settings.mapping[el]?.asAttribute.skip
        ) {
          clearedMapping[el] = { ...settings.mapping[el] };
        }
      });

      const primaryArr = Object.values(clearedMapping).filter(
        (el) => el.is_primary
      );

      if (primaryArr.length !== 1) {
        throw new HttpException(
          'Primary key should be defined and should be selected only one.',
          HttpStatus.BAD_REQUEST
        );
      }

      const passedPK = primaryArr[0];
      const savedPK = await this.customerKeysService.getPrimaryKey(workspace.id, session);

      if (
        savedPK &&
        !(
          savedPK.attribute_type.name === passedPK.asAttribute?.attribute.attribute_type.name &&
          savedPK.name === passedPK.asAttribute?.attribute.name
        )
      ) {
        throw new HttpException(
          'Field selected as primary not corresponding to saved primary Key',
          HttpStatus.BAD_REQUEST
        );
      }

      const folderPath = 'import-errors';
      const errorFileName = `errors-${fileData.fileKey}.csv`;
      const fullPath = path.join(folderPath, errorFileName);
      errorFilePath = fullPath;

      if (!fs.existsSync(folderPath)) {
        fs.mkdirSync(folderPath, { recursive: true });
      }

      if (fs.existsSync(fullPath)) {
        fs.unlinkSync(fullPath);
      }

      const writeErrorsStream = fs.createWriteStream(fullPath);

      let currentBatch = [];
      const promisesList = [];

      const readPromise = new Promise<{
        total: number;
        created: number;
        updated: number;
        skipped: number;
        final: number;
      }>(async (resolve, reject) => {
        const s3CSVStream = await this.s3Service.getImportedCSVReadStream(
          fileData.fileKey
        );
        let total = 0;
        let created = 0;
        let updated = 0;
        let skipped = 0;
        let final = 0;

        const csvStream = fastcsv
          .parse({ headers: true })
          .on('data', async (data) => {
            total++;
            let skippedReason = '';
            let convertedPKValue;

            // validate file data to type convert
            Object.keys(clearedMapping).forEach((el) => {
              if (skippedReason) return;

              const convertResult = this.convertForImport(
                data[el],
                clearedMapping[el].asAttribute?.attribute.attribute_type.name,
                el,
                clearedMapping[el].asAttribute?.attribute.attribute_parameter?.key
              );

              if (convertResult.error) {
                skippedReason = convertResult.error;
                return;
              }

              if (clearedMapping[el].is_primary) {
                convertedPKValue = convertResult.converted;
              }
            });

            if (skippedReason) {
              skipped++;
              writeErrorsStream.write(
                this.formatErrorData(data, skippedReason)
              );
              return;
            } else {
              // currentBatch.push(convertedPKValue);
              // if (currentBatch.length >= 10000) {
              //   promisesList.push(
              //     (async () => {
              //       const { createdCount, updatedCount } =
              //         await this.countCreateUpdateWithBatch(
              //           passedPK.asAttribute?.attribute.name,
              //           Array.from(currentBatch)
              //         );
              //       created += createdCount;
              //       updated += updatedCount;
              //     })()
              //   );
              //   currentBatch = [];
              // }
            }
          })
          .on('end', async () => {
            // if (currentBatch.length > 0) {
            //   promisesList.push(
            //     (async () => {
            //       const { createdCount, updatedCount } =
            //         await this.countCreateUpdateWithBatch(
            //           passedPK.asAttribute?.attribute.name,
            //           Array.from(currentBatch)
            //         );
            //       created += createdCount;
            //       updated += updatedCount;
            //     })()
            //   );
            //   currentBatch = [];
            // }

            // await Promise.all(promisesList);

            writeErrorsStream.end();
            await new Promise((resolve2) =>
              writeErrorsStream.on('finish', resolve2)
            );

            resolve({ total, created, updated, skipped, final });
          });

        s3CSVStream.pipe(csvStream);
      });

      const countResults = await readPromise;

      countResults.final = countResults.total - countResults.skipped;

      let uploadResult = '';
      if (countResults.skipped > 0) {
        const fileBuffer = fs.readFileSync(fullPath);
        const mimeType = 'text/csv';

        const fileForUpload = {
          buffer: fileBuffer,
          originalname: errorFileName,
          mimetype: mimeType,
        };

        uploadResult =
          (await this.s3Service.uploadCustomerImportPreviewErrorsFile(
            fileForUpload
          )) as string;
      }

      await this.removeFile(fullPath);

      return { ...countResults, url: uploadResult };
    } catch (error) {
      this.error(error, this.countImportPreview.name, session);
      if (errorFilePath) await this.removeFile(errorFilePath);
      throw error;
    }
  }

  async startImport(
    account: Account,
    settings: ImportCustomersDTO,
    session: string
  ) {
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    try {
      const fileData = await this.importsRepository.findOneBy({
        account: {
          id: account.id,
        },
        fileKey: settings.fileKey,
      });

      if (!fileData) {
        throw new HttpException(
          'File for analysis is missing, check if you have file uploaded.',
          HttpStatus.BAD_REQUEST
        );
      }

      const clearedMapping: Record<string, MappingParam> = {};
      Object.keys(settings.mapping).forEach((el) => {
        if (
          settings.mapping[el]?.asAttribute &&
          !settings.mapping[el]?.asAttribute.skip
        ) {
          clearedMapping[el] = { ...settings.mapping[el] };
        }
      });

      const primaryArr = Object.values(clearedMapping).filter(
        (el) => el.is_primary
      );

      if (primaryArr.length !== 1) {
        throw new HttpException(
          'Primary key should be defined and should be selected only one.',
          HttpStatus.BAD_REQUEST
        );
      }

      const passedPK = primaryArr[0];
      const savedPK = await this.customerKeysService.getPrimaryKey(workspace.id, session);

      if (
        savedPK &&
        !(
          savedPK.attribute_type.name === passedPK.asAttribute?.attribute.attribute_type.name &&
          savedPK.name === passedPK.asAttribute?.attribute.name
        )
      ) {
        throw new HttpException(
          'Field selected as primary not corresponding to saved primary Key',
          HttpStatus.BAD_REQUEST
        );
      }

      //TODO: Fix import primary key
      // if (!savedPK && passedPK) {
      //   const afterSaveNewPK = await this.CustomerKeysModel.findOneAndUpdate(
      //     {
      //       workspaceId: workspace.id,
      //       key: passedPK.asAttribute?.attribute.name,
      //       type: passedPK.asAttribute?.attribute.attribute_type.name,
      //     },
      //     {
      //       is_primary: true,
      //     },
      //     {
      //       new: true,
      //     }
      //   ).exec();

      //   if (!afterSaveNewPK) {
      //     throw new HttpException(
      //       "Couldn't save selected primary key.",
      //       HttpStatus.BAD_REQUEST
      //     );
      //   }
      // }

      let segmentId = '';

      if (settings.withSegment?.name) {
        const data = await this.segmentsService.create(
          account,
          {
            name: settings.withSegment.name,
            description: settings.withSegment.description,
            inclusionCriteria: {},
            resources: {},
            type: SegmentType.MANUAL,
          },
          session
        );
        segmentId = data.id;
      }

      await Producer.add(QueueType.IMPORTS, {
        fileData,
        clearedMapping,
        account,
        settings,
        passedPK,
        session,
        segmentId,
      }, 'import');

      return;
    } catch (error) {
      this.error(error, this.countImportPreview.name, session);
      throw error;
    }
  }

  async getDuplicates(key: string, workspaceId: string, queryRunner: QueryRunner): Promise<boolean> {
    let docsDuplicates;
    if (queryRunner) {
      docsDuplicates = await queryRunner.manager
        .createQueryBuilder(Customer, "customer")
        .select([`"${key}" AS key`, "COUNT(*) AS count"])
        .addSelect("array_agg(customer) AS docs")
        .where("customer.workspace_id = :workspaceId", { workspaceId })
        .andWhere("customer.isAnonymous = false")
        .groupBy(`customer.${key}`)
        .having("COUNT(*) > 1")
        .limit(2)
        .getRawMany();
    }
    else
      docsDuplicates = await this.customersRepository
        .createQueryBuilder("customer")
        .select([`customer.user_attributes ->> :key AS key`])//, "COUNT(*) AS count"])
        .addSelect("array_agg(customer.id) AS docs")  // Aggregate by customer IDs instead of the full customer object
        .where("customer.workspace = :workspaceId", { workspaceId })
        .andWhere("(customer.system_attributes ->> 'is_anonymous')::boolean = false")
        .groupBy(`1`)//customer.user_attributes ->> :key`)
        // .having("COUNT(*) > 1")
        .setParameter("key", key)
        .limit(2)
        .getRawMany();
    return docsDuplicates.length > 1;
  }

  async deleteAllKeys(workspaceId: string, key: string, session: string, queryRunner?: QueryRunner) {
    await this.customersRepository
      .createQueryBuilder()
      .update()
      .set({
        user_attributes: () =>
          `user_attributes - '${key}'`, // This removes the key from the JSON field
      })
      .where("workspace_id = :workspaceId", { workspaceId })
      .execute();
  }

  async countCustomersInWorkspace(workspaceId: string) {
    return this.customersRepository.countBy({ workspace: { id: workspaceId } });
  }

  async deleteByUUID(account: Account, uuid: string) {
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    await this.customersRepository.delete({
      workspace: { id: workspace.id },
      uuid
    });
  }

  async get(workspaceID: string, session: string, skip?: number, limit?: number, queryRunner?: QueryRunner) {
    return await this.customersRepository
      .createQueryBuilder("customer")
      .where("customer.workspace_id = :workspaceId", { workspaceId: workspaceID })
      .skip(skip)
      .take(limit) // `take` is the equivalent of `limit`
      .getMany();
  }

  async getCustomersByIds(account: Account, customerIds: BigInt[]) {
    return this.customersRepository.find({ where: { id: In(customerIds) } })
  }

  async getCustomerByUUID(uuid: string, workspaceId: string): Promise<Customer> {
    return this.customersRepository.findOne({
      where: {
        uuid: uuid,
        workspace_id: workspaceId
      }
    });
  }
}
