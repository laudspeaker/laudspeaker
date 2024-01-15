/* eslint-disable no-case-declarations */
import mongoose, {
  ClientSession,
  isObjectIdOrHexString,
  isValidObjectId,
  Model,
  Types,
} from 'mongoose';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Customer, CustomerDocument } from './schemas/customer.schema';
import { CreateCustomerDto } from './dto/create-customer.dto';
import mockData from '../../fixtures/mockData';
import { Account } from '../accounts/entities/accounts.entity';
import { Audience } from '../audiences/entities/audience.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, QueryRunner, Repository } from 'typeorm';
import { EventDto } from '../events/dto/event.dto';
import {
  AttributeType,
  CustomerKeys,
  CustomerKeysDocument,
} from './schemas/customer-keys.schema';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { createClient, Row } from '@clickhouse/client';
import { Workflow } from '../workflows/entities/workflow.entity';
import { attributeConditions } from '../../fixtures/attributeConditions';
import { getType } from 'tst-reflect';
import { isDateString, isEmail } from 'class-validator';
import { parse } from 'csv-parse';
import { SegmentsService } from '../segments/segments.service';
import { AudiencesHelper } from '../audiences/audiences.helper';
import { SegmentCustomers } from '../segments/entities/segment-customers.entity';
import { AudiencesService } from '../audiences/audiences.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { EventsService } from '../events/events.service';
import * as _ from 'lodash';
import { randomUUID } from 'crypto';
import { StepsService } from '../steps/steps.service';
import { S3Service } from '../s3/s3.service';
import { Imports } from './entities/imports.entity';
import { thrift } from '@databricks/sql';
import {
  ImportCustomersDTO,
  ImportOptions,
  MappingParam,
} from './dto/import-customers.dto';
import * as fastcsv from 'fast-csv';
import * as fs from 'fs';
import path from 'path';
import { isValid } from 'date-fns';
import e from 'express';
import { JourneyLocationsService } from '../journeys/journey-locations.service';
import { Journey } from '../journeys/entities/journey.entity';
import { SegmentType } from '../segments/entities/segment.entity';
import { UpdatePK_DTO } from './dto/update-pk.dto';
import {
  KEYS_TO_SKIP,
  validateKeyForMutations,
} from '@/utils/customer-key-name-validator';

export type Correlation = {
  cust: CustomerDocument;
  found: boolean;
};

const eventsMap = {
  sent: 'sent',
  clicked: 'clicked',
  delivered: 'delivered',
  opened: 'opened',
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

@Injectable()
export class CustomersService {
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
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @InjectQueue('customers') private readonly customersQueue: Queue,
    @InjectQueue('imports') private readonly importsQueue: Queue,
    @InjectModel(Customer.name) public CustomerModel: Model<CustomerDocument>,
    @InjectModel(CustomerKeys.name)
    public CustomerKeysModel: Model<CustomerKeysDocument>,
    private dataSource: DataSource,
    private segmentsService: SegmentsService,
    @InjectRepository(Account)
    public accountsRepository: Repository<Account>,
    @InjectRepository(Imports)
    public importsRepository: Repository<Imports>,
    private readonly audiencesHelper: AudiencesHelper,
    private readonly audiencesService: AudiencesService,
    @Inject(WorkflowsService)
    private readonly workflowsService: WorkflowsService,
    @Inject(StepsService)
    private readonly stepsService: StepsService,
    @Inject(EventsService)
    private readonly eventsService: EventsService,
    @InjectConnection()
    private readonly connection: mongoose.Connection,
    private readonly s3Service: S3Service,
    @Inject(JourneyLocationsService)
    private readonly journeyLocationsService: JourneyLocationsService
  ) {
    const session = randomUUID();
    (async () => {
      try {
        const collection = this.connection.db.collection('customers');
        await collection.createIndex('ownerId');
        await collection.createIndex(
          { __posthog__id: 1, ownerId: 1 },
          {
            unique: true,
            partialFilterExpression: {
              __posthog__id: { $exists: true, $type: 'array', $gt: [] },
            },
          }
        );
      } catch (e) {
        this.error(e, CustomersService.name, session);
      }
    })();
  }

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

  async create(
    account: Account,
    createCustomerDto: CreateCustomerDto,
    session: string,
    transactionSession?: ClientSession
  ): Promise<
    Customer &
      mongoose.Document & {
        _id: Types.ObjectId;
      }
  > {
    const createdCustomer = new this.CustomerModel({
      ownerId: (<Account>account).id,
      ...createCustomerDto,
    });
    const ret = await createdCustomer.save({ session: transactionSession });

    for (const key of Object.keys(ret.toObject()).filter(
      (item) => !KEYS_TO_SKIP.includes(item)
    )) {
      const value = ret[key];
      if (value === '' || value === undefined || value === null) continue;

      const keyType = getType(value);
      const isArray = keyType.isArray();
      let type = isArray ? getType(value[0]).name : keyType.name;

      if (type === 'String') {
        if (isEmail(value)) type = 'Email';
        if (isDateString(value)) type = 'Date';
      }

      await this.CustomerKeysModel.updateOne(
        { key, ownerId: account.id },
        {
          $set: {
            key,
            type,
            isArray,
            ownerId: account.id,
          },
        },
        { upsert: true }
      ).exec();
    }

    await this.dataSource.transaction(async (transactionManager) => {
      // Already started (isEditable = false), dynamic (isDyanmic = true),push
      // Not started (isEditable = true), dynamic (isDyanmic = true), push
      const dynamicWkfs = await transactionManager.find(Workflow, {
        where: {
          owner: { id: account.id },
          isDynamic: true,
        },
        relations: ['filter'],
      });
      for (let index = 0; index < dynamicWkfs.length; index++) {
        const workflow = dynamicWkfs[index];
        if (workflow.filter) {
          if (
            await this.audiencesHelper.checkInclusion(
              ret,
              workflow.filter.inclusionCriteria,
              session
            )
          ) {
            const audiences = await transactionManager.findBy(Audience, {
              workflow: { id: workflow.id },
            });

            const primaryAudience = audiences.find(
              (audience) => audience.isPrimary
            );

            await transactionManager.update(
              Audience,
              { owner: { id: account.id }, id: primaryAudience.id },
              {
                customers: primaryAudience.customers.concat(ret.id),
              }
            );
          }
        }
      }
      // Already started(isEditable = true), static(isDyanmic = false), don't push
      // Not started(isEditable = false), static(isDyanmic = false), push
      const staticWkfs = await transactionManager.find(Workflow, {
        where: {
          owner: { id: account.id },
          isDynamic: false,
        },
        relations: ['filter'],
      });
      for (let index = 0; index < staticWkfs.length; index++) {
        const workflow = staticWkfs[index];
        if (workflow.filter) {
          if (
            await this.audiencesHelper.checkInclusion(
              ret,
              workflow.filter.inclusionCriteria,
              session
            )
          ) {
            const audiences = await transactionManager.findBy(Audience, {
              workflow: { id: workflow.id },
              isEditable: false,
            });

            const primaryAudience = audiences.find((item) => item.isPrimary);

            await transactionManager.update(
              Audience,
              { owner: { id: account.id }, id: primaryAudience.id },
              {
                customers: primaryAudience.customers.concat(ret.id),
              }
            );
          }
        }
      }
    });

    return ret;
  }

  /**
   * Finds all customers that match the inclusion criteria. Uses findAll under
   * the hood.
   *
   * @remarks
   * Optimize this to happen inside of mongo later.
   *
   * @param account - The owner of the customers
   * @param criteria - Inclusion criteria to match on
   *
   */
  async findByInclusionCriteriaTwo(
    account: Account,
    criteria: any,
    transactionSession: ClientSession,
    session: string
  ): Promise<CustomerDocument[]> {
    let customers: CustomerDocument[] = [];
    const ret: CustomerDocument[] = [];
    try {
      customers = await this.CustomerModel.find({
        ownerId: (<Account>account).id,
      })
        .session(transactionSession)
        .exec();
    } catch (err) {
      return Promise.reject(err);
    }

    this.debug(
      `${JSON.stringify({ customers })}`,
      this.findByInclusionCriteriaTwo.name,
      session
    );
    for (const customer of customers) {
      if (
        await this.audiencesHelper.checkInclusion(
          customer,
          criteria,
          session,
          account
        )
      )
        ret.push(customer);
    }

    return Promise.resolve(ret);
  }

  async addPhCustomers(data: any[], account: Account) {
    for (let index = 0; index < data.length; index++) {
      const addedBefore = await this.CustomerModel.find({
        ownerId: (<Account>account).id,
        posthogId: {
          $in: [...data[index]['distinct_ids']],
        },
      }).exec();
      let createdCustomer: CustomerDocument;
      //create customer only if we don't see before, otherwise update data
      if (addedBefore.length === 0) {
        createdCustomer = new this.CustomerModel({});
      } else {
        createdCustomer = addedBefore[0];
      }

      createdCustomer['ownerId'] = account.id;
      createdCustomer['posthogId'] = data[index]['distinct_ids'];
      createdCustomer['phCreatedAt'] = data[index]['created_at'];
      if (data[index]?.properties?.$initial_os) {
        createdCustomer['phInitialOs'] = data[index]?.properties.$initial_os;
      }
      if (data[index]?.properties?.$geoip_time_zone) {
        createdCustomer['phGeoIpTimeZone'] =
          data[index]?.properties.$geoip_time_zone;
      }
      if (account['posthogEmailKey'] != null) {
        const emailKey = account['posthogEmailKey'][0];
        if (data[index]?.properties[emailKey]) {
          createdCustomer['phEmail'] = data[index]?.properties[emailKey];
        }
      }

      if (account['posthogFirebaseDeviceTokenKey'] != null) {
        const firebaseDeviceTokenKey =
          account['posthogFirebaseDeviceTokenKey'][0];
        if (data[index]?.properties[firebaseDeviceTokenKey]) {
          createdCustomer['phDeviceToken'] =
            data[index]?.properties[firebaseDeviceTokenKey];
        }
      }
      await createdCustomer.save();
    }
  }

  async findAll(
    account: Account,
    take = 100,
    skip = 0,
    key = '',
    search = '',
    showFreezed = false,
    createdAtSortType: 'asc' | 'desc' = 'desc'
  ): Promise<{ data: CustomerDocument[]; totalPages: number }> {
    const totalPages =
      Math.ceil(
        (await this.CustomerModel.count({
          ownerId: (<Account>account).id,
        }).exec()) / take
      ) || 1;
    const customers = await this.CustomerModel.find({
      ownerId: (<Account>account).id,
      ...(key && search
        ? {
            [key]: new RegExp(`.*${search}.*`, 'i'),
          }
        : {}),
      ...(showFreezed ? {} : { isFreezed: { $ne: true } }),
    })
      .skip(skip)
      .limit(take <= 100 ? take : 100)
      .sort({ _id: createdAtSortType === 'asc' ? 1 : -1 })
      .exec();
    return { data: customers, totalPages };
  }

  async findOne(account: Account, id: string, session: string) {
    if (!isValidObjectId(id))
      throw new HttpException('Id is not valid', HttpStatus.BAD_REQUEST);

    const customer = await this.CustomerModel.findOne({
      _id: new Types.ObjectId(id),
      ownerId: account.id,
    }).exec();
    if (!customer)
      throw new HttpException('Person not found', HttpStatus.NOT_FOUND);
    return {
      ...customer.toObject(),
      _id: id,
    };
  }

  async transactionalFindOne(
    account: Account,
    id: string,
    transactionSession: ClientSession
  ) {
    if (!isValidObjectId(id))
      throw new HttpException('Id is not valid', HttpStatus.BAD_REQUEST);

    const customer = await this.CustomerModel.findOne({
      _id: new Types.ObjectId(id),
      ownerId: account.id,
    })
      .session(transactionSession)
      .exec();
    if (!customer)
      throw new HttpException('Person not found', HttpStatus.NOT_FOUND);

    return {
      ...customer.toObject(),
      _id: id,
    };
  }

  async findCustomerEvents(
    account: Account,
    customerId: string,
    session: string,
    page: number = 1,
    pageSize: number = 10
  ) {
    const offset = (page - 1) * pageSize;

    const countResponse = await this.clickhouseClient.query({
      query: `SELECT count() as totalCount FROM message_status WHERE customerId = {customerId:String}`,
      query_params: { customerId },
    });

    const totalCount =
      (await countResponse.json<{ data: { totalCount: number }[] }>()).data[0]
        ?.totalCount || 0;
    const totalPage = Math.ceil(totalCount / pageSize);

    const response = await this.clickhouseClient.query({
      query: `
        SELECT stepId, event, createdAt, eventProvider, templateId 
        FROM message_status 
        WHERE customerId = {customerId:String} 
        ORDER BY createdAt DESC
        LIMIT ${pageSize} OFFSET ${offset}
      `,
      query_params: { customerId },
    });

    const data = (
      await response.json<{
        data: { audienceId: string; event: string; createdAt: string }[];
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

  /**
   * Update or create a customer based on a PostHog Identify event. Deletes protected keys if they are present on the event,
   * looks up existing customers using the user ID and/or anonymous ID on the event, and sets properties on the user prepended
   * with _posthog_. If the user ID and/or anonymous ID correlate to more than one customer, event is skipped.
   *
   * @param account Account associated with call
   * @param identifyEvent Event Object
   * @param transactionSession Mongo transaction session
   * @param session HTTP session
   * @returns Promise<boolean>
   */
  async phIdentifyUpdate(
    account: Account,
    identifyEvent: any,
    transactionSession: ClientSession,
    session: string
  ): Promise<boolean> {
    let query: any;
    try {
      delete identifyEvent.verified;
      delete identifyEvent.ownerId;
      delete identifyEvent._id;
      delete identifyEvent.__v;
      delete identifyEvent.workflows;
      delete identifyEvent.journeys;

      query = {
        ownerId: (<Account>account).id,
        $or: [
          { posthogId: { $in: [identifyEvent.userId] } },
          { posthogId: { $in: [identifyEvent.anonymousId] } },
        ],
      };
      this.debug(
        `Preexisting customers query: ${JSON.stringify({ query: query })}`,
        this.phIdentifyUpdate.name,
        session,
        account.id
      );

      const addedBefore = await this.CustomerModel.find(query)
        .session(transactionSession)
        .exec();

      if (addedBefore.length === 1) {
        this.debug(
          `Customer to update on Identify event: ${JSON.stringify({
            customer: addedBefore,
          })}`,
          this.phIdentifyUpdate.name,
          session,
          account.id
        );

        query = {
          $addToSet: {
            posthogId: {
              $each: this.filterFalsyAndDuplicates([
                identifyEvent.userId,
                identifyEvent.anonymousId,
              ]),
            },
          },
          ...this.addPrefixToKeys(identifyEvent.context.traits, '_postHog_'),
          ...(identifyEvent.phEmail && { phEmail: identifyEvent.phEmail }),
          ...(identifyEvent.phPhoneNumber && {
            phPhoneNumber: identifyEvent.phPhoneNumber,
          }),
          ...(identifyEvent.phDeviceToken && {
            phDeviceToken: identifyEvent.phDeviceToken,
          }),
        };
        this.debug(
          `Update one customer query: ${JSON.stringify({ query: query })}`,
          this.phIdentifyUpdate.name,
          session,
          account.id
        );

        const res = await this.CustomerModel.updateOne(
          {
            _id: new mongoose.Types.ObjectId(addedBefore[0].id),
          },
          query
        )
          .session(transactionSession)
          .exec();
        this.debug(
          `Customer updated on Identify event: ${JSON.stringify({
            result: res,
          })}`,
          this.phIdentifyUpdate.name,
          session,
          account.id
        );
        return true;
      } else if (addedBefore.length === 0) {
        query = {
          ownerId: (<Account>account).id,
          posthogId: this.filterFalsyAndDuplicates([
            identifyEvent.userId
              ? identifyEvent.userId
              : identifyEvent.anonymousId,
            identifyEvent.anonymousId,
          ]),
          ...this.addPrefixToKeys(identifyEvent.context.traits, '_postHog_'),
          ...(identifyEvent.phEmail && { phEmail: identifyEvent.phEmail }),
          ...(identifyEvent.phPhoneNumber && {
            phPhoneNumber: identifyEvent.phPhoneNumber,
          }),
          ...(identifyEvent.phDeviceToken && {
            phDeviceToken: identifyEvent.phDeviceToken,
          }),
        };
        this.debug(
          `Create one customer query: ${JSON.stringify({ query: query })}`,
          this.phIdentifyUpdate.name,
          session,
          account.id
        );
        const createdCustomer = new this.CustomerModel(query);
        const res = await createdCustomer.save({ session: transactionSession });
        this.debug(
          `Created new customer on Identify event: ${JSON.stringify(res)}`,
          this.phIdentifyUpdate.name,
          session,
          account.id
        );
        return false;
      } else {
        this.warn(
          `Found multiple customers with same posthog ID, skipping Identify event update: ${JSON.stringify(
            { customers: addedBefore }
          )}`,
          this.phIdentifyUpdate.name,
          session,
          account.id
        );
      }
    } catch (e) {
      this.error(e, this.phIdentifyUpdate.name, session, account.id);
      throw e;
    }
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

    if (customer.isFreezed)
      throw new BadRequestException('Customer is freezed');

    if (customer.ownerId != account.id) {
      throw new HttpException("You can't update this customer.", 400);
    }

    for (const key of Object.keys(newCustomerData).filter(
      (item) => !KEYS_TO_SKIP.includes(item)
    )) {
      const value = newCustomerData[key];
      if (value === '' || value === undefined || value === null) continue;

      const keyType = getType(value);
      const isArray = keyType.isArray();
      let type = isArray ? getType(value[0]).name : keyType.name;

      if (type === 'String') {
        if (isEmail(value)) type = 'Email';
        if (isDateString(value)) type = 'Date';
      }

      await this.CustomerKeysModel.updateOne(
        { key, ownerId: account.id },
        {
          $set: {
            key,
            type,
            isArray,
            ownerId: account.id,
          },
        },
        { upsert: true }
      ).exec();
    }

    delete customer._id;

    const newCustomer = Object.fromEntries(
      Object.entries({
        ...customer,
        ...newCustomerData,
      }).filter(([_, v]) => v != null)
    );

    const replacementRes = await this.CustomerModel.findByIdAndUpdate(
      { _id: id },
      newCustomer
    ).exec();

    return replacementRes;
  }

  async transactionalUpdate(
    account: Account,
    id: string,
    session: string,
    updateCustomerDto: Record<string, unknown>,
    transactionSession: ClientSession
  ) {
    try {
      const { ...newCustomerData } = updateCustomerDto;
      delete newCustomerData.verified;
      delete newCustomerData.ownerId;
      delete newCustomerData._id;
      delete newCustomerData.__v;
      delete newCustomerData.audiences;
      delete newCustomerData.isFreezed;
      delete newCustomerData.id;

      const customer = await this.transactionalFindOne(
        account,
        id,
        transactionSession
      );

      if (customer.isFreezed)
        throw new BadRequestException('Customer is freezed');

      if (customer.ownerId != account.id) {
        throw new HttpException("You can't update this customer.", 400);
      }

      for (const key of Object.keys(newCustomerData).filter(
        (item) => !KEYS_TO_SKIP.includes(item)
      )) {
        const value = newCustomerData[key];
        if (value === '' || value === undefined || value === null) continue;

        const keyType = getType(value);
        const isArray = keyType.isArray();
        let type = isArray ? getType(value[0]).name : keyType.name;

        if (type === 'String') {
          if (isEmail(value)) type = 'Email';
          if (isDateString(value)) type = 'Date';
        }

        await this.CustomerKeysModel.updateOne(
          { key, ownerId: account.id },
          {
            $set: {
              key,
              type,
              isArray,
              ownerId: account.id,
            },
          },
          { upsert: true }
        )
          .session(transactionSession)
          .exec();
      }

      const newCustomer = Object.fromEntries(
        Object.entries({
          ...customer,
          ...newCustomerData,
        }).filter(([_, v]) => v != null)
      );

      await this.CustomerModel.replaceOne({ _id: id }, newCustomer)
        .session(transactionSession)
        .exec();

      return newCustomerData;
    } catch (e) {
      this.error(e, this.transactionalUpdate.name, session);
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
      take,
      skip,
      searchKey,
      searchValue,
      showFreezed,
      createdAtSortType || 'desc'
    );

    const pk = (
      await this.CustomerKeysModel.findOne({
        isPrimary: true,
        ownerId: account.id,
      })
    )?.toObject();

    const listInfo = await Promise.all(
      data.map(async (person) => {
        const info: Record<string, any> = {};
        (info['id'] = person['_id'].toString()),
          (info['salient'] =
            person['phEmail'] ||
            person['email'] ||
            person['slackEmail'] ||
            person['slackRealName'] ||
            '...');

        info.email = person.email || person.phEmail;
        info.phone = person.phone;
        info.createdAt = new Date(
          parseInt(person._id.toString().slice(0, 8), 16) * 1000
        ).toUTCString();
        info.dataSource = 'people';

        if (pk && person[pk.key]) {
          info[pk.key] = person[pk.key];
        }

        if (checkInSegment)
          info.isInsideSegment = await this.segmentsService.isCustomerMemberOf(
            account,
            checkInSegment,
            person.id
          );

        return info;
      })
    );

    return { data: listInfo, totalPages, pkName: pk?.key };
  }

  async findAudienceStatsCustomers(
    account: Account,
    session: string,
    take = 100,
    skip = 0,
    event?: string,
    audienceId?: string
  ) {
    if (take > 100) take = 100;

    if (eventsMap[event] && audienceId) {
      const customersCountResponse = await this.clickhouseClient.query({
        query: `SELECT COUNT(DISTINCT(customerId)) FROM message_status WHERE audienceId = {audienceId:UUID} AND event = {event:String}`,
        query_params: { audienceId, event: eventsMap[event] },
      });
      const customersCountResponseData = (
        await customersCountResponse.json<{ data: { 'count()': string }[] }>()
      )?.data;
      const customersCount = +customersCountResponseData?.[0]?.['count()'] || 1;

      const totalPages = Math.ceil(customersCount / take);

      const response = await this.clickhouseClient.query({
        query: `SELECT DISTINCT(customerId) FROM message_status WHERE audienceId = {audienceId:UUID} AND event = {event:String} ORDER BY createdAt LIMIT {take:Int32} OFFSET {skip:Int32}`,
        query_params: { audienceId, event: eventsMap[event], take, skip },
      });
      const data = (await response.json<{ data: { customerId: string }[] }>())
        ?.data;
      const customerIds = data?.map((item) => item.customerId) || [];

      return {
        totalPages,
        data: await Promise.all(
          customerIds.map(async (id) => ({
            ...(await this.findById(account, id))?.toObject(),
            id,
          }))
        ),
      };
    }
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
      await this.customersQueue.add('sync', {
        url: posthogUrl,
        auth: authString,
        account: account,
      });
    } catch (e) {
      this.error(e, this.ingestPosthogPersons.name, session);
    }
  }

  async findByAudience(
    account: Account,
    audienceId: string
  ): Promise<CustomerDocument[]> {
    return this.CustomerModel.find({
      ownerId: (<Account>account).id,
      audiences: audienceId,
    }).exec();
  }

  async findByCustomerId(customerId: string, clientSession: ClientSession) {
    if (!isValidObjectId(customerId))
      throw new BadRequestException('Invalid object id');

    let query = this.CustomerModel.findById(customerId);
    if (clientSession) {
      query.session(clientSession);
    }
    const found = await query.exec();
    return found;
  }

  async findById(
    account: Account,
    customerId: string,
    clientSession?: ClientSession
  ): Promise<
    Customer &
      mongoose.Document & {
        _id: Types.ObjectId;
      }
  > {
    if (!isValidObjectId(customerId))
      throw new BadRequestException('Invalid object id');

    let query = this.CustomerModel.findById(customerId);
    if (clientSession) {
      query.session(clientSession);
    }
    const found = await query.exec();
    if (found && found?.ownerId == (<Account>account).id) return found;
    return;
  }

  async findBySlackId(
    account: Account,
    slackId: string
  ): Promise<CustomerDocument> {
    const customers = await this.CustomerModel.find({
      ownerId: (<Account>account).id,
      slackId: slackId,
    }).exec();
    return customers[0];
    //return found;
  }

  async findByExternalIdOrCreate(
    account: Account,
    id: string
  ): Promise<CustomerDocument> {
    const customers = await this.CustomerModel.find({
      ownerId: (<Account>account).id,
      externalId: id,
    }).exec();
    if (customers.length < 1) {
      const createdCustomer = new this.CustomerModel({
        ownerId: (<Account>account).id,
        externalId: id,
      });
      return createdCustomer.save();
    } else return customers[0];
  }

  async findByCustomEvent(account: Account, id: string): Promise<Correlation> {
    const customers = await this.CustomerModel.find({
      ownerId: (<Account>account).id,
      slackId: id,
    }).exec();
    if (customers.length < 1) {
      const createdCustomer = new this.CustomerModel({
        ownerId: (<Account>account).id,
        slackId: id,
      });
      return { cust: await createdCustomer.save(), found: false };
    } else return { cust: customers[0], found: true };
  }

  /**
   * Finds or creates a customer document based on a correlation key/value pair. Uses an event and mapping to add fields to the customer document.
   *
   * @param account Account that customer document is associated with
   * @param correlationKey Document key to check against
   * @param correlationValue If String, checks if document[correlationKey] equals correlation value; if Array, checks if document[correlationKey] contains any of correlationValue[i]
   * @param event PostHog event to extract pH fields from
   * @param transactionSession MongoDB transaction session
   * @param session HTTP session
   * @param mapping Mapping of pH fields to Customer Document fields
   * @returns Correlation
   */

  async findBySpecifiedEvent(
    account: Account,
    correlationKey: string,
    correlationValue: string | string[],
    event: any,
    transactionSession: ClientSession,
    session: string,
    mapping?: (event: any) => any
  ): Promise<Correlation> {
    let customer, createdCustomer: CustomerDocument;
    const queryParam: any = {
      ownerId: (<Account>account).id,
    };
    if (Array.isArray(correlationValue)) {
      queryParam.$or = [];
      for (let i = 0; i < correlationValue.length; i++) {
        queryParam.$or.push({
          [correlationKey]: { $in: [correlationValue[i]] },
        });
      }
    } else {
      queryParam[correlationKey] = correlationValue;
    }
    this.debug(
      `Looking for customer using query ${JSON.stringify({
        query: queryParam,
      })}`,
      this.findBySpecifiedEvent.name,
      session,
      account.id
    );
    customer = await this.CustomerModel.findOne(queryParam)
      .session(transactionSession)
      .exec();
    if (!customer) {
      this.debug(
        `Customer not found, creating new customer...`,
        this.findBySpecifiedEvent.name,
        session,
        account.id
      );
      if (mapping) {
        const newCust = mapping(event);
        newCust['ownerId'] = (<Account>account).id;
        newCust[correlationKey] = Array.isArray(correlationValue)
          ? this.filterFalsyAndDuplicates(correlationValue)
          : correlationValue;
        createdCustomer = new this.CustomerModel(newCust);
      } else {
        createdCustomer = new this.CustomerModel({
          ownerId: (<Account>account).id,
          correlationKey: Array.isArray(correlationValue)
            ? this.filterFalsyAndDuplicates(correlationValue)
            : correlationValue,
        });
      }
      this.debug(
        `Created new customer ${JSON.stringify(createdCustomer)}`,
        this.findBySpecifiedEvent.name,
        session,
        account.id
      );
      return {
        cust: await createdCustomer.save({ session: transactionSession }),
        found: false,
      };
      //to do cant just return [0] in the future
    } else {
      this.debug(
        `Customer found: ${JSON.stringify(customer)}`,
        this.findBySpecifiedEvent.name,
        session,
        account.id
      );
      const updateObj: any = mapping ? mapping(event) : undefined;
      if (Array.isArray(correlationValue)) {
        updateObj.$addToSet = {
          [correlationKey]: {
            $each: this.filterFalsyAndDuplicates(correlationValue),
          },
        };
      } else {
        updateObj[correlationKey] = correlationValue;
      }
      customer = await this.CustomerModel.findOneAndUpdate(
        queryParam,
        updateObj
      )
        .session(transactionSession)
        .exec();
      this.debug(
        `Customer updated: ${JSON.stringify(customer)}`,
        this.findBySpecifiedEvent.name,
        session,
        account.id
      );
      return { cust: customer, found: true };
    }
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
   * @param {ClientSession} [transactionSession]  Mongo Transaction
   * @param {number} [skip] How many documents to skip; used for pagination
   * @param {number} [limit] Max no. documents to return; used for pagination
   *
   * @returns {Promise<CustomerDocument[]>} Array of customer documents
   *
   */
  async find(
    account: string,
    criteria: any,
    session: string,
    transactionSession?: ClientSession,
    skip?: number,
    limit?: number
  ): Promise<CustomerDocument[]> {
    let query: any;
    if (
      !criteria ||
      criteria.type === 'allCustomers' ||
      !criteria.query ||
      !criteria.query.statements ||
      !criteria.query.statements.length
    ) {
      query = this.CustomerModel.find({
        ownerId: account,
      });
    } else {
      //TODO: We need to translate segment builder condiitons
      // into a mongo query
    }

    if (transactionSession) query.session(transactionSession);
    if (limit) query.limit(limit);
    if (skip) query.skip(skip);
    return await query.exec();
  }

  /**
   * Adds journey to customer's `Journeys` array.
   *
   * @param {CustomerDocument} customers The owner of the customers; if a string, its the id,otherwise its an account object
   * @param {string} session Session identifier
   * @param {ClientSession} [transactionSession]  Mongo Transaction
   * @param {number} [skip] How many documents to skip; used for pagination
   * @param {number} [limit] Max no. documents to return; used for pagination
   *
   * @returns {Promise<CustomerDocument[]>} Array of customer documents
   *
   */
  async updateJourneyList(
    customers: CustomerDocument[],
    journeyID: string,
    session: string,
    transactionSession?: ClientSession
  ) {
    const unenrolledCustomers = customers.filter(
      (customer) => customer.journeys.indexOf(journeyID) < 0
    );
    const query = this.CustomerModel.updateMany(
      {
        _id: { $in: unenrolledCustomers.map((customer) => customer.id) },
      },
      {
        $addToSet: {
          journeys: journeyID,
        },
        $set: {
          [`journeyEnrollmentsDates.${journeyID}`]: new Date().toUTCString(),
        },
      }
    );
    if (transactionSession) query.session(transactionSession);

    return await query.exec();
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
    transactionSession?: ClientSession
  ): Promise<number> {
    let count = 0;
    if (
      !criteria ||
      criteria.type === 'allCustomers' ||
      !criteria.query ||
      !criteria.query.statements ||
      !criteria.query.statements.length
    ) {
      count = await this.CustomerModel.countDocuments({
        ownerId: (<Account>account).id,
      })
        .session(transactionSession)
        .exec();
    } else {
      //TODO: We need to translate segment builder condiitons
      // into a mongo query
    }

    this.debug(
      `${JSON.stringify({ audienceSize: count })}`,
      this.getAudienceSize.name,
      session,
      account.email
    );

    return count;
  }

  checkInclusion(
    customer: CustomerDocument,
    inclusionCriteria: any,
    session: string,
    account?: Account
  ) {
    return this.audiencesHelper.checkInclusion(
      customer,
      inclusionCriteria,
      session,
      account
    );
  }

  /**
   * Find a single customer that has [correlationKey]=correlationValue
   * belonging to account.id
   *
   * @remarks
   * Optimize this to happen inside of mongo later.
   *
   * @param account - The owner of the customers
   * @param correlationKey - matching key to use, i.e. email or slackId
   * @param correlationValue - matching value to use, i.e. a@b.com or UABC1234
   *
   */
  async findByCorrelationKVPair(
    account: Account,
    correlationKey: string,
    correlationValue: string | string[],
    session: string,
    transactionSession?: ClientSession
  ): Promise<CustomerDocument> {
    let customer: CustomerDocument; // Found customer
    const queryParam: any = {
      ownerId: (<Account>account).id,
    };
    if (Array.isArray(correlationValue)) {
      queryParam.$or = [];
      for (let i = 0; i < correlationValue.length; i++) {
        queryParam.$or.push({
          [correlationKey]: { $in: [correlationValue[i]] },
        });
      }
    } else {
      queryParam[correlationKey] = correlationValue;
    }
    queryParam.isFreezed = { $ne: true };
    try {
      if (transactionSession) {
        customer = await this.CustomerModel.findOne(queryParam)
          .session(transactionSession)
          .exec();
      } else {
        customer = await this.CustomerModel.findOne(queryParam).exec();
      }
    } catch (err) {
      this.error(
        err,
        this.findByCorrelationKVPair.name,
        session,
        account.email
      );
      return Promise.reject(err);
    }
    return Promise.resolve(customer);
  }

  async findOrCreateByCorrelationKVPair(
    account: Account,
    dto: EventDto,
    transactionSession: ClientSession
  ): Promise<Correlation> {
    let customer: CustomerDocument; // Found customer
    const queryParam = { ownerId: (<Account>account).id };
    queryParam[dto.correlationKey] = dto.correlationValue;
    try {
      customer = await this.CustomerModel.findOne(queryParam)
        .session(transactionSession)
        .exec();
    } catch (err) {
      return Promise.reject(err);
    }
    if (!customer) {
      const createdCustomer = new this.CustomerModel(queryParam);
      return {
        cust: await createdCustomer.save({ session: transactionSession }),
        found: false,
      };
    } else return { cust: customer, found: true };
  }

  async upsert(
    account: Account,
    dto: Record<string, unknown>,
    session: string
  ): Promise<string> {
    let correlation: Correlation;

    const transactionSession = await this.connection.startSession();
    transactionSession.startTransaction();
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const eventDto: any = {
        correlationKey: dto.correlationKey,
        correlationValue: dto.correlationValue,
        source: null,
      };
      correlation = await this.findOrCreateByCorrelationKVPair(
        account,
        eventDto,
        transactionSession
      );

      const left = correlation.cust.toObject();
      const right = _.cloneDeep(dto);

      delete right.correlationKey;
      delete right.correlationValue;

      await this.transactionalUpdate(
        account,
        correlation.cust.id,
        session,
        _.merge(left, right),
        transactionSession
      );

      if (!correlation.found)
        await this.workflowsService.enrollCustomer(
          account,
          correlation.cust,
          queryRunner,
          transactionSession,
          session
        );

      await transactionSession.commitTransaction();
      await queryRunner.commitTransaction();
    } catch (err) {
      await transactionSession.abortTransaction();
      await queryRunner.rollbackTransaction();
      this.error(err, this.upsert.name, session, account.email);
      throw err;
    } finally {
      await transactionSession.endSession();
      await queryRunner.release();
    }
    return Promise.resolve(correlation.cust.id);
  }

  async mergeCustomers(
    account: Account,
    oldCustomer: any,
    newCustomer: any
  ): Promise<void> {
    //we assume newer information is more up to date
    oldCustomer.slackName = newCustomer.name;

    if (newCustomer.real_name != null) {
      oldCustomer.slackRealName = newCustomer.real_name;
    }
    if (newCustomer.team_id?.length)
      oldCustomer.slackTeamId = newCustomer.team_id;

    if (newCustomer.profile?.first_name) {
      oldCustomer.firstName = newCustomer.profile.first_name;
    }

    if (newCustomer.profile?.last_name) {
      oldCustomer.lastName = newCustomer.profile.last_name;
    }
    if (newCustomer.tz_offset != null) {
      oldCustomer.slackTimeZone = newCustomer.tz_offset;
    }
    if (newCustomer.profile?.email != null) {
      oldCustomer.slackEmail = newCustomer.profile.email;
    }
    oldCustomer.slackDeleted = newCustomer.deleted;
    oldCustomer.slackAdmin = newCustomer.is_admin;
    //false until specified by user
    if (!newCustomer.is_admin) {
      oldCustomer.slackTeamMember = false;
    } else {
      oldCustomer.slackTeamMember = true;
    }
    await oldCustomer.save();
  }

  async removeById(account: Account, custId: string, session: string) {
    this.debug(
      `Removing customer ${JSON.stringify({ id: custId })}`,
      this.removeById.name,
      session,
      account.id
    );
    if (account.customerId === custId)
      throw new BadRequestException("You can't delete yourself as a customer");

    const cust = await this.CustomerModel.findById(custId);
    this.debug(
      `Found customer ${JSON.stringify(cust)}`,
      this.removeById.name,
      session,
      account.id
    );

    if (cust.isFreezed) throw new BadRequestException('Customer is freezed');

    const res = await this.CustomerModel.deleteOne({
      _id: new mongoose.Types.ObjectId(cust.id),
    });
    this.debug(
      `Deleted customer ${JSON.stringify(res)}`,
      this.removeById.name,
      session,
      account.id
    );
  }

  async getAttributes(account: Account, resourceId: string, session: string) {
    const attributes = await this.CustomerKeysModel.find({
      ownerId: account.id,
    }).exec();
    if (resourceId === 'attributes') {
      return {
        id: resourceId,
        nextResourceURL: 'attributeConditions',
        options: attributes.map((attribute) => ({
          label: attribute.key,
          id: attribute.key,
          nextResourceURL: attribute.key,
        })),
        type: 'select',
      };
    }

    const attribute = attributes.find(
      (attribute) => attribute.key === resourceId
    );
    if (attribute)
      return {
        id: resourceId,
        options: attributeConditions(attribute.type, attribute.isArray),
        type: 'select',
      };

    if (resourceId === 'memberof') {
      const segments = await this.segmentsService.segmentRepository.findBy({
        owner: { id: account.id },
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

    try {
      const errorPromise = new Promise<{
        headers: string[];
        emptyCount: number;
        firstThreeRecords: Object[];
      }>((resolve, reject) => {
        let headers = [];
        let firstThreeRecords = [];
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

      const primaryAttribute = await this.CustomerKeysModel.findOne({
        $and: [{ isPrimary: true }, { ownerId: account.id }],
      });

      if (primaryAttribute && !res.headers.includes(primaryAttribute.key)) {
        throw new BadRequestException(
          `CSV file should contain column with same name as defined Primary key: ${primaryAttribute.key}`
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
      if (!importFile) {
        throw new BadRequestException("Can't find imported file for deletion.");
      }

      await this.removeImportFile(account, fileKey);
    } catch (error) {
      this.error(error, this.deleteImportFile.name, session);
      throw new BadRequestException(
        `Error getting last importedCSV, account ${account.id}, sessions:${session}`
      );
    }
  }

  async getLastImportCSV(account: Account, session?: string) {
    try {
      const importFile = await this.importsRepository.findOneBy({
        account: {
          id: account.id,
        },
      });

      const primaryAttribute = await this.CustomerKeysModel.findOne({
        $and: [{ isPrimary: true }, { ownerId: account.id }],
      });

      const response = { ...importFile, primaryAttribute: undefined };
      if (primaryAttribute) {
        response.primaryAttribute = primaryAttribute.toObject();
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

    for await (const record of records) {
      if (record.email) {
        let customer = await this.CustomerModel.findOne({
          email: record.email,
          ownerId: account.id,
        });

        if (customer) {
          await this.update(account, customer.id, record, session);
          stats.updated++;
        } else {
          delete record.verified;
          delete record.ownerId;
          delete record._id;
          delete record.__v;
          delete record.audiences;

          customer = await this.create(account, { ...record }, session);
          stats.created++;
        }
        stats.customers.push(customer.id);
      } else {
        stats.skipped++;
      }
    }

    return { stats };
  }

  public async deleteEverywhere(id: string) {
    await this.dataSource.transaction(async (transactionManager) => {
      await transactionManager.delete(SegmentCustomers, { customerId: id });
      await transactionManager.query(
        'UPDATE audience SET customers = array_remove(audience."customers", $1) WHERE $2 = ANY(audience."customers")',
        [id, id]
      );
    });
  }

  public async getDynamicAudiencesWithCustomer(
    customerId: string
  ): Promise<Audience[]> {
    return this.dataSource.query(
      'SELECT * FROM audience WHERE $1 = ANY(audience."customers") AND (SELECT workflow."isDynamic" FROM workflow WHERE workflow."id" = audience."workflowId") = true',
      [customerId]
    );
  }

  public async recheckDynamicInclusion(
    account: Account,
    customer: CustomerDocument,
    session: string
  ) {
    const audiences = await this.getDynamicAudiencesWithCustomer(customer.id);
    for (const audience of audiences) {
      const inclusionCriteria = await this.audiencesService.getFilter(
        account,
        audience.id,
        session
      );

      if (!inclusionCriteria) continue;

      const custIndex = audience.customers.indexOf(customer.id);

      if (
        custIndex > -1 &&
        !(await this.audiencesHelper.checkInclusion(
          customer,
          inclusionCriteria,
          session,
          account
        ))
      ) {
        audience.customers.splice(custIndex, 1);
      }
    }

    await this.audiencesService.audiencesRepository.save(
      audiences.map((audience) => ({
        id: audience.id,
        customers: audience.customers,
      }))
    );
  }

  public async getPossibleAttributes(
    account: Account,
    session: string,
    key = '',
    type?: string | string[],
    isArray?: boolean,
    removeLimit?: boolean
  ) {
    const query = this.CustomerKeysModel.find({
      $and: [
        {
          key: RegExp(`.*${key}.*`, 'i'),
          ownerId: account.id,
          ...(type !== null && !(type instanceof Array)
            ? { type }
            : type instanceof Array
            ? { $or: type.map((el) => ({ type: el })) }
            : {}),
          ...(isArray !== null ? { isArray } : {}),
        },
      ],
    });

    if (!removeLimit) {
      query.limit(20);
    }
    const attributes = await query.exec();

    return (
      attributes
        .map((el) => ({
          key: el.key,
          type: el.type,
          isArray: el.isArray,
          isPrimary: el.isPrimary,
        }))
        // @ts-ignore
        .filter((el) => el.type !== 'undefined')
    );
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
        query: `SELECT COUNT(DISTINCT(customerId)) FROM message_status WHERE stepId = {stepId:UUID} AND event = {event:String}`,
        query_params: { stepId, event: eventsMap[event] },
      });
      const customersCountResponseData = (
        await customersCountResponse.json<{ data: { 'count()': string }[] }>()
      )?.data;
      const customersCount = +customersCountResponseData?.[0]?.['count()'] || 1;

      const totalPages = Math.ceil(customersCount / take);

      const response = await this.clickhouseClient.query({
        query: `SELECT DISTINCT(customerId) FROM message_status WHERE stepId = {stepId:UUID} AND event = {event:String} ORDER BY createdAt LIMIT {take:Int32} OFFSET {skip:Int32}`,
        query_params: { stepId, event: eventsMap[event], take, skip },
      });
      const data = (await response.json<{ data: { customerId: string }[] }>())
        ?.data;
      const customerIds = data?.map((item) => item.customerId) || [];

      return {
        totalPages,
        data: await Promise.all(
          customerIds.map(async (id) => ({
            ...(await this.findById(account, id))?.toObject(),
            id,
          }))
        ),
      };
    }
  }

  public async countCustomersInStep(account: Account, stepId: string) {
    const step = await this.stepsService.findOne(account, stepId, '');
    if (!step) throw new NotFoundException('Step not found');

    let result = step.customers.length;

    for (const customerJSON of step.customers) {
      const customerId = JSON.parse(customerJSON)?.customerID;

      if (!customerId) {
        result--;
        continue;
      }

      const customer = await this.findById(account, customerId);
      if (!customer) {
        result--;
        continue;
      }
    }

    return result;
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
    if (take > 100) take = 100;

    const step = await this.stepsService.findOne(account, stepId, '');
    if (!step) throw new NotFoundException('Step not found');

    const totalPages = Math.ceil(step.customers.length / take || 1);

    const customerIds = step.customers
      .slice(skip, skip + take)
      .map((customer) => JSON.parse(customer).customerID);

    const customers = await Promise.all(
      customerIds.map(async (customerId) => {
        const customer = await this.findById(account, customerId);
        if (!customer) return undefined;

        return { id: customer.id, email: customer.email };
      })
    );

    return {
      data: customers.filter((customer) => customer && customer.id),
      totalPages,
    };
  }

  public async isCustomerEnrolledInJourney(
    account: Account,
    customer: CustomerDocument,
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
    const customer = await this.CustomerModel.findOne({
      _id: custId,
      ownerId: user.id,
    });

    if (!customer) {
      throw new HttpException('Such customer not found', HttpStatus.FORBIDDEN);
    }

    const queryText = `
    SELECT 
    jr.id, 
    jr.name, 
    COALESCE(
        (
            SELECT 
                NOT (
                    (sp.metadata)::json #>'{destination}' IS NOT NULL 
                    OR EXISTS (
                        SELECT 1 
                        FROM jsonb_array_elements(sp.metadata -> 'branches') AS branch 
                        WHERE (branch ->> 'destination') IS NOT NULL
                    )
                    OR (sp.metadata -> 'timeBranch' ->> 'destination') IS NOT NULL
                )
            FROM 
                step AS sp 
            WHERE 
                EXISTS (
                    SELECT 1 
                    FROM unnest(sp.customers :: jsonb[]) AS json_text 
                    WHERE json_text ->> 'customerID' = $1
                ) 
                AND sp."journeyId" = jr.id
        ), true
        ) as "isFinished",
              (
                  SELECT 
                      sp.id
                  FROM 
                      step AS sp 
                  WHERE 
                      EXISTS (
                          SELECT 1 
                          FROM unnest(sp.customers :: jsonb[]) AS json_text 
                          WHERE json_text ->> 'customerID' = $1
                      ) 
                      AND sp."journeyId" = jr.id
              ) as "currentStepId"
          FROM 
              journey as jr 
              LEFT JOIN step ON step."journeyId" = jr.id 
          WHERE 
              jr.id = ANY($2)
          GROUP BY 
              jr.id 
          LIMIT $3 OFFSET $4`;

    const totalJourneys = await this.dataSource.query(
      `
        SELECT COUNT(DISTINCT jr.id) 
        FROM journey as jr 
        LEFT JOIN step ON step."journeyId" = jr.id 
        WHERE jr.id = ANY($1);
      `,
      [customer.journeys]
    );

    const data = await this.dataSource.query<JourneyDataForTimeLine[]>(
      queryText,
      [customer.id, customer.journeys, take, skip]
    );

    return {
      data: data.map((el) => ({
        ...el,
        enrollmentTime: customer?.journeyEnrollmentsDates?.[el.id] || null,
      })),
      total: Number(totalJourneys[0].count),
    };
  }

  async customersSize(account: Account, session: string) {
    const totalNumberOfCustomers = this.CustomerModel.find({
      ownerId: account.id,
    }).count();

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
      this.getSegmentCustomersFromQuery.name,
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
    this.connection.db.collection(thisCollectionName);
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
      let unionAggregation: any[] = [];
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
      const collectionHandle =
        this.connection.db.collection(thisCollectionName);
      await collectionHandle.aggregate(unionAggregation).toArray();

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
            await this.connection.db.collection(collection).drop();
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
  * 
  * 
  * Takes in a segment query (inclusion criteria) and returns a string that is the name of a mongo collection of customerIds
  * NB a query is composed of SingleStatements, and sub queries (which we sometimes call statement with subquery)
  * 
  * @remarks
  * This can be, and needs to be optimized, we need to offload as much logic to the actual databases
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
    this.debug(
      'Creating segment from query',
      this.getSegmentCustomersFromQuery.name,
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
    this.connection.db.collection(thisCollectionName);
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
      let unionAggregation: any[] = [];
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
      const collectionHandle =
        this.connection.db.collection(thisCollectionName);
      await collectionHandle.aggregate(unionAggregation).toArray();

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
            await this.connection.db.collection(collection).drop();
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

      let unionAggregation: any[] = [];
      /*
      [
        { $group: { _id: "$customerId" } }
      ];
      */

      this.debug(
        `the sets are: ${sets}`,
        this.getSegmentCustomersFromQuery.name,
        session,
        account.id
      );
      this.debug(
        `about to union the sets`,
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
      const collectionHandle = this.connection.db.collection(sets[0]);
      await collectionHandle.aggregate(unionAggregation).toArray();

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
            await this.connection.db.collection(collection).drop();
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
    const { type, segmentId } = statement;
    const collectionOfCustomersFromSegment =
      await this.segmentsService.getSegmentCustomers(
        account,
        session,
        segmentId,
        intermediateCollection
      );
    return collectionOfCustomersFromSegment;
  }

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
    } = statement;

    const userIdCondition = `userId = '${userId}'`;
    let sqlQuery = `SELECT customerId FROM message_status WHERE `;

    if (
      type === 'Email' ||
      type === 'Push' ||
      type === 'SMS' ||
      type === 'In-App' ||
      type === 'Webhook'
    ) {
      if (from.key !== 'ANY') {
        sqlQuery += `stepId = '${fromSpecificMessage.key}' AND `;
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
      sqlQuery += `${userIdCondition} `;

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
      const collectionHandle = this.connection.db.collection(
        intermediateCollection
      );
      const batchSize = 1000; // Define batch size
      let batch = [];

      const stream = countEvents.stream();

      stream.on('data', (rows: Row[]) => {
        rows.forEach((row: Row) => {
          const cleanedText = row.text.replace(/^"(.*)"$/, '$1'); // Removes surrounding quotes
          batch.push({ customerId: cleanedText });
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
      });

      await new Promise((resolve) => {
        stream.on('end', () => {
          if (batch.length > 0) {
            // Insert any remaining documents
            (async () => {
              try {
                const result = await collectionHandle.insertMany(batch);
                console.log('Final batch of documents inserted:', result);
              } catch (err) {
                console.error('Error inserting documents:', err);
              }
            })();
          }
          this.debug(
            'Completed!',
            this.customersFromMessageStatement.name,
            session,
            account.id
          );
          resolve(0);
        });
      });

      return intermediateCollection;
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
      subComparisonValue,
    } = statement;
    let query: any = {
      ownerId: (<Account>account).id,
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
    switch (comparisonType) {
      case 'is equal to':
        //checked
        query[key] = value;
        break;
      case 'is not equal to':
        //checked
        query[key] = { $ne: value };
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
        query[key] = { $gt: value };
        break;
      case 'is less than':
        query[key] = { $lt: value };
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
          throw new Error('Invalid sub-comparison type for nested property');
        }
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

    this.connection.db.collection(intermediateCollection);

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

    const docs = await this.CustomerModel.aggregate(aggregationPipeline).exec();

    this.debug(
      `Here are the docs: ${JSON.stringify(docs, null, 2)}`,
      this.customersFromAttributeStatement.name,
      session,
      account.id
    );
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

  /**
   * Gets the primary key for a given user
   *
   * @returns string
   */
  async getPrimaryKey(account: Account, session: string): Promise<string> {
    let currentPK: string = await this.CustomerKeysModel.findOne({
      ownerId: account.id,
      isPrimary: true,
    });

    if (currentPK) {
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
      currentPK = 'email';
      return currentPK;
    }
  }

  /**
   * Gets set of customers from a single statement that
   * includes Events,
   *
   *  eg onboarding has performed 1 times
   *
   * Handles SINGLE statements not queries with subqueries
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
    const { eventName, comparisonType, value, time, additionalProperties } =
      statement;

    this.debug(
      'In customersEventStatement/n\n',
      this.customersFromEventStatement.name,
      session,
      account.id
    );

    this.debug(
      `value is: ${value}`,
      this.customersFromEventStatement.name,
      session,
      account.id
    );

    this.debug(
      `here are time and additional properties if they exist`,
      this.customersFromEventStatement.name,
      session,
      account.id
    );

    this.debug(
      JSON.stringify(time, null, 2),
      this.customersFromEventStatement.name,
      session,
      account.id
    );

    this.debug(
      JSON.stringify(additionalProperties, null, 2),
      this.customersFromEventStatement.name,
      session,
      account.id
    );

    this.debug(
      `comparison type is: ${comparisonType}`,
      this.customersFromEventStatement.name,
      session,
      account.id
    );
    // ****
    const mongoQuery: any = {
      event: eventName,
      ownerId: (<Account>account).id,
    };

    if (time) {
      switch (time.comparisonType) {
        case 'before':
          //.toUTCString()
          mongoQuery.createdAt = {
            $lt: new Date(time.timeBefore).toISOString(),
          };
          break;
        case 'after':
          mongoQuery.createdAt = {
            $gt: new Date(time.timeAfter).toISOString(),
          };
          break;
        case 'during':
          mongoQuery.createdAt = {
            $gte: new Date(time.timeAfter).toISOString(),
            $lte: new Date(time.timeBefore).toISOString(),
          };
          break;
        default:
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

    this.debug(
      'mongo query is/n\n',
      this.customersFromEventStatement.name,
      session,
      account.id
    );

    this.debug(
      JSON.stringify(mongoQuery, null, 2),
      this.customersFromEventStatement.name,
      session,
      account.id
    );
    this.debug(
      `creating collection`,
      this.customersFromEventStatement.name,
      session,
      account.id
    );
    this.connection.db.collection(intermediateCollection);

    // we should enact a strict policy in all other areas in the application as matching here is done on primary key

    if (comparisonType === 'has performed') {
      this.debug(
        'in the aggregate construction - has performed',
        this.customersFromEventStatement.name,
        session,
        account.id
      );

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
        {
          $group: {
            _id: null,
            customerIds: { $push: '$_id' },
          },
        },
        { $out: intermediateCollection },
        //to do
      ];

      this.debug(
        'aggregate query is/n\n',
        this.customersFromEventStatement.name,
        session,
        account.id
      );

      this.debug(
        JSON.stringify(aggregationPipeline, null, 2),
        this.customersFromEventStatement.name,
        session,
        account.id
      );

      //fetch users here
      const result: any = await this.eventsService.getCustomersbyEventsMongo(
        aggregationPipeline
      );
      /*
      * Example result is: 
      [
        {
          "_id": null,
          "customerIds": [
            "658515aba1256bc5c2232ba7",
            "658515aba1256bc5c2232bad",
            "6585156aa1256bc5c2232ba0"
          ]
        }
      ]
      Empty example: []
      */
      //console.log("results are", JSON.stringify(result, null, 2));
      /*
      this.debug(
        'Here are the results',
        this.customersFromEventStatement.name,
        session,
        account.id
      );
      this.debug(
        JSON.stringify(result, null, 2),
        this.customersFromEventStatement.name,
        session,
        account.id
      );
      if (result.length > 0) {
        const customerIdsSet: Set<string> = new Set(result[0].customerIds);
        return customerIdsSet;
      }
      else{
        // no customers who satisfy conditions so return empty set
        return new Set<string>();
      }
      */
      return intermediateCollection;
    } else if (comparisonType === 'has not performed') {
      /*
       * we first check if the event has ever been performed
       * if not we return all customers
       *
       * if event has been performed by any user, we get the customer ids of the users who have performed
       * then filter for all other customer ids ie never performed event
       *
       */
      this.debug(
        'in the aggregate construction - has performed',
        this.customersFromEventStatement.name,
        session,
        account.id
      );

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
      this.debug(
        'the check is',
        this.customersFromEventStatement.name,
        session,
        account.id
      );
      this.debug(
        JSON.stringify(check, null, 2),
        this.customersFromEventStatement.name,
        session,
        account.id
      );

      if (check.length < 1) {
        this.debug(
          'no events of this name',
          this.customersFromEventStatement.name,
          session,
          account.id
        ); //the event does not exist, so we should return all customers
        const allUsers = [
          {
            $match: {
              ownerId: (<Account>account).id,
            },
          },
          {
            $group: {
              _id: null,
              customerIds: { $push: '$_id' },
            },
          },
          {
            $project: {
              _id: 1,
              //_id: 0,
              //allCustomerIds: '$customerIds'
            },
          },
          { $out: intermediateCollection },
        ];

        const result = await this.CustomerModel.aggregate(allUsers).exec();
        /*
        this.debug(
          'the result is',
          this.customersFromEventStatement.name,
          session,
          account.id
        );
        this.debug(
          JSON.stringify(result,null,2),
          this.customersFromEventStatement.name,
          session,
          account.id
        );
        //console.log("the result is", JSON.stringify(result,null,2) );

        if (result.length > 0) {
          const customerIdsSet: Set<string> = new Set(result[0].allCustomerIds);
          return customerIdsSet;
        }
        else{
          // no customers who satisfy conditions so return empty set
          // likely on a fresh account with no users 
          return new Set<string>();
        }
        */
        return intermediateCollection;
      }
      this.debug(
        'event exists',
        this.customersFromEventStatement.name,
        session,
        account.id
      );
      // double lookup, first find users who perform id, then filter them out
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
        {
          $group: {
            _id: '$event',
            correlationValues: { $addToSet: '$correlationValue' },
            matchedCustomers: { $addToSet: '$matchedCustomers._id' },
          },
        },
        {
          $lookup: {
            from: 'customers',
            let: {
              matchedCustomerIds: '$matchedCustomers',
              correlationValues: '$correlationValues',
            },
            pipeline: [
              {
                $match: {
                  $expr: {
                    $and: [
                      {
                        $not: {
                          $in: [
                            '$' + (await this.getPrimaryKey(account, session)),
                            { $ifNull: ['$$correlationValues', []] },
                          ],
                        },
                      },
                      {
                        $not: {
                          $in: [
                            '$_id',
                            { $ifNull: ['$$matchedCustomerIds', []] },
                          ],
                        },
                      },
                    ],
                  },
                },
              },
            ],
            as: 'unmatchedCustomers',
          },
        },
        {
          $project: {
            unmatchedCustomers: {
              $map: {
                input: '$unmatchedCustomers',
                as: 'customer',
                in: '$$customer._id',
              },
            },
            _id: 0,
          },
        },
        { $out: intermediateCollection },
      ];

      this.debug(
        'aggregate query is/n\n',
        this.customersFromEventStatement.name,
        session,
        account.id
      );

      this.debug(
        JSON.stringify(aggregationPipeline, null, 2),
        this.customersFromEventStatement.name,
        session,
        account.id
      );

      const result = await this.eventsService.getCustomersbyEventsMongo(
        aggregationPipeline
      );

      this.debug(
        'Here are the results',
        this.customersFromEventStatement.name,
        session,
        account.id
      );

      this.debug(
        JSON.stringify(result, null, 2),
        this.customersFromEventStatement.name,
        session,
        account.id
      );

      return intermediateCollection;
    } else {
      return intermediateCollection;
      //return new Set<string>();
    }
    return intermediateCollection;
    //return false;
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
    customer?: CustomerDocument,
    customerId?: string
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
      customer = await this.findById(account, customerId);
      // customer = await this.CustomerModel.findOne({
      //   _id: new Types.ObjectId(customerId),
      //   ownerId: account.id,
      // }).exec();
      if (!customer) throw new Error('Person not found');
    }
    this.debug(
      `the query is: ${JSON.stringify(query, null, 2)}`,
      this.checkCustomerMatchesQuery.name,
      session,
      account.id
    );
    this.debug(
      `the customer is: ${JSON.stringify(customer, null, 2)}`,
      this.checkCustomerMatchesQuery.name,
      session,
      account.id
    );
    if (query.type === 'all') {
      this.debug(
        'the query has all (AND',
        this.checkCustomerMatchesQuery.name,
        session,
        account.id
      );
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
      this.debug(
        'the query has any (OR)',
        this.checkCustomerMatchesQuery.name,
        session,
        account.id
      );
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
      //shouldnt get here
      this.debug(
        `shouldnt get here, what is query type?: ${JSON.stringify(
          query.type,
          null,
          2
        )}`,
        this.checkCustomerMatchesQuery.name,
        session,
        account.id
      );
    }
    return false;
  }

  async evaluateStatementWithSubQuery(
    customer: CustomerDocument,
    statement: any,
    account: Account,
    session: string
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
    customer: CustomerDocument,
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
    this.debug(
      'NB this function takes in single statements not full queries, for full queries use customerMatchesQuery/n\n',
      this.evaluateSingleStatement.name,
      session,
      account.id
    );
    this.debug(
      'In evaluateSingleStatement deciding which sub evaluate statement to go to next/n\n',
      this.evaluateSingleStatement.name,
      session,
      account.id
    );

    this.debug(
      `the query is: ${JSON.stringify(statement, null, 2)}`,
      this.evaluateSingleStatement.name,
      session,
      account.id
    );

    this.debug(
      `the type is: ${JSON.stringify(type, null, 2)}`,
      this.evaluateSingleStatement.name,
      session,
      account.id
    );

    this.debug(
      `the key is: ${key}`,
      this.evaluateSingleStatement.name,
      session,
      account.id
    );

    this.debug(
      `value is: ${value}`,
      this.evaluateSingleStatement.name,
      session,
      account.id
    );

    this.debug(
      `the subComparisonValue is: ${subComparisonValue}`,
      this.evaluateSingleStatement.name,
      session,
      account.id
    );

    switch (type) {
      case 'Attribute':
        return this.evaluateAttributeStatement(customer, statement, session);
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
    customer: CustomerDocument,
    statement: any,
    account: Account,
    typeOfMessage: string,
    session: string
  ): Promise<boolean> {
    const userId = (<Account>account).id;
    this.debug(
      'In evaluate message statement',
      this.evaluateMessageStatement.name,
      session,
      account.id
    );
    this.debug(
      `the type of message is: ${typeOfMessage}`,
      this.evaluateMessageStatement.name,
      session,
      account.id
    );
    this.debug(
      `account id is: ${userId}`,
      this.evaluateMessageStatement.name,
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
    } = statement;

    const userIdCondition = `userId = '${userId}'`;
    let sqlQuery = `SELECT COUNT(*) FROM message_status WHERE `;
    //let sqlQuery = `SELECT * FROM message_status WHERE `;

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
      sqlQuery += `${userIdCondition} `;

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
        sqlQuery += `AND createdAt >= '${timeAfter}' `;
      }
      this.debug(
        `the final SQL query is:\n ${sqlQuery}`,
        this.evaluateMessageStatement.name,
        session,
        account.id
      );

      //const testQuery = "SELECT COUNT(*) FROM message_status" ;
      const countEvents = await this.clickhouseClient.query({
        query: sqlQuery,
        format: 'CSV',
        //query_params: { customerId },
      });

      let countOfEvents = '0';
      const stream = countEvents.stream();
      stream.on('data', (rows: Row[]) => {
        rows.forEach((row: Row) => {
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
    customer: CustomerDocument,
    statement: any,
    account: Account,
    session: string
  ): Promise<boolean> {
    const { eventName, comparisonType, value, time, additionalProperties } =
      statement;
    /* 
    console.log('In evaluateEventStatement/n\n');
    console.log(
      'here are time and additional properties (if they exist)',
      JSON.stringify(time, null, 2)
    );
    console.log(JSON.stringify(additionalProperties, null, 2));
    console.log('comparison type is', comparisonType);
    */
    this.debug(
      'In evaluateEventStatement/n\n',
      this.evaluateEventStatement.name,
      session,
      account.id
    );
    this.debug(
      'here are time and additional properties (if they exist)',
      this.evaluateEventStatement.name,
      session,
      account.id
    );
    this.debug(
      JSON.stringify(time, null, 2),
      this.evaluateEventStatement.name,
      session,
      account.id
    );
    this.debug(
      JSON.stringify(additionalProperties, null, 2),
      this.evaluateEventStatement.name,
      session,
      account.id
    );
    this.debug(
      `comparison type is: ${comparisonType}`,
      this.evaluateEventStatement.name,
      session,
      account.id
    );

    // ****
    const mongoQuery: any = {
      event: eventName,
      ownerId: (<Account>account).id,
    };

    let currentPK: string = await this.CustomerKeysModel.findOne({
      ownerId: account.id,
      isPrimary: true,
    });

    if (currentPK) {
      this.debug(
        `current pk is: ${currentPK}`,
        this.evaluateEventStatement.name,
        session,
        account.id
      );
      mongoQuery.correlationKey = currentPK;
      mongoQuery.correlationValue = customer[currentPK];
    } else {
      // Handle case where currentPK is null
      //uncomment when primary key thing is working correctly
      /*
      throw new HttpException(
        "Select a primary key first.",
        HttpStatus.BAD_REQUEST
      );
      */

      //to do just for testing
      console.log('pk isnt working so set as email');
      currentPK = 'email';
      mongoQuery.correlationKey = currentPK;
      mongoQuery.correlationValue = customer[currentPK];
    }

    if (time) {
      switch (time.comparisonType) {
        case 'before':
          //.toUTCString()
          mongoQuery.createdAt = {
            $lt: new Date(time.timeBefore).toISOString(),
          };
          break;
        case 'after':
          mongoQuery.createdAt = {
            $gt: new Date(time.timeAfter).toISOString(),
          };
          break;
        case 'during':
          mongoQuery.createdAt = {
            $gte: new Date(time.timeAfter).toISOString(),
            $lte: new Date(time.timeBefore).toISOString(),
          };
          break;
        default:
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

    //console.log('mongo query is/n\n', JSON.stringify(mongoQuery, null, 2));
    this.debug(
      'mongo query is/n\n',
      this.evaluateEventStatement.name,
      session,
      account.id
    );

    this.debug(
      JSON.stringify(mongoQuery, null, 2),
      this.evaluateEventStatement.name,
      session,
      account.id
    );

    if (comparisonType === 'has performed') {
      return (await this.eventsService.getEventsByMongo(
        mongoQuery,
        customer
      )) >= value
        ? true
        : false;
    } else if (comparisonType === 'has not performed') {
      //need to check the logic for this one
      return (await this.eventsService.getEventsByMongo(mongoQuery, customer)) <
        1
        ? true
        : false;
    }
    //return (await this.eventsService.getEventsByMongo(mongoQuery )) >= value ? true : false ;
    return false;
  }

  evaluateAttributeStatement(
    customer: CustomerDocument,
    statement: any,
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
      subComparisonValue,
    } = statement;

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

    // Perform comparison based on comparisonType
    //console.log('comparison type is', comparisonType);
    this.debug(
      `comparison type is: ${comparisonType}`,
      this.evaluateAttributeStatement.name,
      session
    );
    switch (comparisonType) {
      case 'is equal to':
        //not checked
        return customerValue === value;
      case 'is not equal to':
        return customerValue !== value;
      case 'contains':
        if (typeof customerValue === 'string' && typeof value === 'string') {
          return customerValue.includes(value);
        }
        return false;
      case 'does not contain':
        if (typeof customerValue === 'string' && typeof value === 'string') {
          return !customerValue.includes(value);
        }
        return false;
      case 'exist':
        return customerValue !== undefined && customerValue !== null;
      case 'not exist':
        return customerValue === undefined || customerValue === null;
      case 'is greater than':
        if (typeof customerValue === 'number' && typeof value === 'number') {
          return customerValue > value;
        }
        return false;
      case 'is less than':
        if (typeof customerValue === 'number' && typeof value === 'number') {
          return customerValue < value;
        }
        return false;
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

  //** test **
  /*
   * NB the structure of the query argument
   *
   *
   */
  async testCustomerInSegment(query: any, account: Account): Promise<boolean> {
    //Promise<Set<string>>  {
    let session = 'this is a fake session';
    this.debug(
      'In Test Customer Segment',
      this.testCustomerInSegment.name,
      session,
      account.id
    );
    this.debug(
      'test query is',
      this.testCustomerInSegment.name,
      session,
      account.id
    );
    this.debug(
      JSON.stringify(query, null, 2),
      this.testCustomerInSegment.name,
      session,
      account.id
    );

    console.log('here here');

    let testCustomer = new this.CustomerModel({
      externalId: '6583b25df2be8cd3c8b17f61',
      firstName: 'A',
      lastName: 'B',
      email: 'd@trytachyon.com',
      workflows: [],
      journeys: ['12624e62-367e-483b-9ddf-38160f4fd955'],
      ownerId: 'c65069d2-ef33-427b-b093-6dd5870c4c33',
      posthogId: [],
      verified: true,
      __v: 0,
    });

    this.debug(
      JSON.stringify(testCustomer, null, 2),
      this.testCustomerInSegment.name,
      session,
      account.id
    );

    console.log('here here 3');

    //statement, account, session
    const eventCust = await this.getSegmentCustomersFromQuery(
      query,
      account,
      'fake session',
      true,
      0,
      'test_collection'
    );
    console.log('the result of the eventCust is', eventCust); //JSON.stringify(eventCust, null, 2));

    //query: any,account: Account,session: string,customer?: CustomerDocument, customerId?: string,
    const resultOfCheckCustomerMatchesQuery =
      await this.checkCustomerMatchesQuery(
        query,
        account,
        'fake session',
        testCustomer
      );
    console.log(
      'the result of the evaluation is',
      resultOfCheckCustomerMatchesQuery
    );

    //console.log("test customer is", JSON.stringify(testCustomer,null,2));
    //console.log("the segment and the customer are", await this.checkCustomerMatchesQuery(testCustomer, query, account));

    return false; //await evaluateStatement()
    /*
    let custs = await this.getSegmentCustomersFromQuery(query, account, session)
    
    console.log(
      'the segment is',
      custs
    );
    this.debug(
      `the segment is: ${custs}`,
      this.testCustomerInSegment.name,
      session,
      account.id
    );
    return custs;
    */
  }

  public async searchForTest(
    account: Account,
    take = 100,
    skip = 0,
    search = ''
  ): Promise<{
    data: { id: string; email: string; phone: string }[];
    totalPages: number;
  }> {
    const query: any = { ownerId: account.id };

    const deviceTokenConditions = {
      $or: [
        { androidDeviceToken: { $exists: true, $ne: '' } },
        { iosDeviceToken: { $exists: true, $ne: '' } },
      ],
    };

    if (search) {
      const searchConditions = {
        $or: [
          { email: new RegExp(`.*${search}.*`, 'i') },
          { phone: new RegExp(`.*${search}.*`, 'i') },
        ],
      };

      query['$and'] = [deviceTokenConditions, searchConditions];
    } else {
      query['$or'] = deviceTokenConditions['$or'];
    }

    const totalCustomers = await this.CustomerModel.count(query).exec();
    const totalPages = Math.ceil(totalCustomers / take) || 1;

    const customers = await this.CustomerModel.find(query)
      .skip(skip)
      .limit(take <= 100 ? take : 100)
      .lean()
      .exec();

    return {
      data: customers.map((cust) => {
        const info: { id: string; email: string; phone: string } = {
          id: '',
          email: '',
          phone: '',
        };
        info['id'] = cust['_id'].toString();
        info['email'] = cust['email']?.toString() || '';
        info['phone'] = cust['phone']?.toString() || '';
        return info;
      }),
      totalPages,
    };
  }

  async createAttribute(
    account: Account,
    key: string,
    type: AttributeType,
    session: string
  ) {
    try {
      if (!Object.values(AttributeType).includes(type)) {
        throw new BadRequestException(
          `Type: ${type} can't be used for attribute creation.`
        );
      }

      validateKeyForMutations(key);

      const previousKey = await this.CustomerKeysModel.findOne({
        key: key.trim(),
        type,
        isArray: false,
        ownerId: account.id,
      }).exec();

      if (previousKey) {
        throw new HttpException(
          'Similar key already exist,please use different name or type',
          503
        );
      }

      const newKey = await this.CustomerKeysModel.create({
        key: key.trim(),
        type,
        isArray: false,
        ownerId: account.id,
      });
      return newKey;
    } catch (error) {
      this.error(error, this.createAttribute.name, session);
      throw error;
    }
  }

  formatErrorData(data, errorMessage) {
    return `"${JSON.stringify(data).replace(/"/g, '""')}","${errorMessage}"\n`;
  }

  convertForImport(
    value: string,
    convertTo: AttributeType,
    columnName: string
  ) {
    let error = '';
    let isError = false;
    let converted;
    if (convertTo === AttributeType.STRING) {
      converted = String(value);
    } else if (convertTo === AttributeType.NUMBER) {
      converted = Number(value);
      if (isNaN(converted)) {
        converted = 0;
        isError = true;
      }
    } else if (convertTo === AttributeType.BOOLEAN) {
      converted = Boolean(value);
    } else if (convertTo === AttributeType.DATE) {
      if (isValid(new Date(value))) converted = new Date(value).getTime();
      else isError = true;
    } else if (convertTo === AttributeType.EMAIL) {
      if (isEmail(value)) {
        converted = String(value);
      } else {
        converted = '';
        isError = true;
      }
    }

    if (isError) {
      error = `Error converting '${value}' in '${columnName}' to type '${convertTo.toString()}'`;
    }

    return { converted, error };
  }

  async countCreateUpdateWithBatch(pk: string, data: any[]) {
    const existing = await this.CustomerModel.find({
      [pk]: { $in: data },
    }).exec();

    return {
      createdCount: data.length - existing.length,
      updatedCount: existing.length,
    };
  }

  async countImportPreview(
    account: Account,
    settings: ImportCustomersDTO,
    session: string
  ) {
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
        (el) => el.isPrimary
      );

      if (primaryArr.length !== 1) {
        throw new HttpException(
          'Primary key should be defined and should be selected only one.',
          HttpStatus.BAD_REQUEST
        );
      }

      const passedPK = primaryArr[0];
      const savedPK = await this.CustomerKeysModel.findOne({
        ownerId: account.id,
        isPrimary: true,
      }).exec();

      if (
        savedPK &&
        !(
          savedPK.type === passedPK.asAttribute.type &&
          savedPK.key === passedPK.asAttribute.key
        )
      ) {
        throw new HttpException(
          'Field selected as primary not corresponding to saved primary Key',
          HttpStatus.BAD_REQUEST
        );
      }

      const docs = await this.CustomerModel.aggregate([
        {
          $match: {
            ownerId: account.id,
          },
        },
        {
          $group: {
            _id: `$${passedPK.asAttribute.key}`,
            count: { $sum: 1 },
            docs: { $push: '$$ROOT' },
          },
        },
        {
          $match: {
            count: { $gt: 1 },
          },
        },
      ]).option({ allowDiskUse: true });

      if (!!docs?.length) {
        throw new HttpException(
          "Selected primary key can't be used cause it's value has duplicates among already existing users.",
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
      let promisesList = [];

      const readPromise = new Promise<{
        created: number;
        updated: number;
        skipped: number;
      }>(async (resolve, reject) => {
        const s3CSVStream = await this.s3Service.getImportedCSVReadStream(
          fileData.fileKey
        );
        let created = 0;
        let updated = 0;
        let skipped = 0;

        const csvStream = fastcsv
          .parse({ headers: true })
          .on('data', async (data) => {
            let skippedReason = '';
            let convertedPKValue;

            // validate file data to type convert
            Object.keys(clearedMapping).forEach((el) => {
              if (skippedReason) return;

              const convertResult = this.convertForImport(
                data[el],
                clearedMapping[el].asAttribute.type,
                el
              );

              if (convertResult.error) {
                skippedReason = convertResult.error;
                return;
              }

              if (clearedMapping[el].isPrimary) {
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
              currentBatch.push(convertedPKValue);

              if (currentBatch.length >= 10000) {
                promisesList.push(
                  (async () => {
                    const { createdCount, updatedCount } =
                      await this.countCreateUpdateWithBatch(
                        passedPK.asAttribute.key,
                        Array.from(currentBatch)
                      );
                    created += createdCount;
                    updated += updatedCount;
                  })()
                );
                currentBatch = [];
              }
            }
          })
          .on('end', async () => {
            if (currentBatch.length > 0) {
              promisesList.push(
                (async () => {
                  const { createdCount, updatedCount } =
                    await this.countCreateUpdateWithBatch(
                      passedPK.asAttribute.key,
                      Array.from(currentBatch)
                    );
                  created += createdCount;
                  updated += updatedCount;
                })()
              );
              currentBatch = [];
            }

            await Promise.all(promisesList);

            writeErrorsStream.end();
            await new Promise((resolve2) =>
              writeErrorsStream.on('finish', resolve2)
            );

            resolve({ created, updated, skipped });
          });

        s3CSVStream.pipe(csvStream);
      });

      const countResults = await readPromise;

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
        (el) => el.isPrimary
      );

      if (primaryArr.length !== 1) {
        throw new HttpException(
          'Primary key should be defined and should be selected only one.',
          HttpStatus.BAD_REQUEST
        );
      }

      const passedPK = primaryArr[0];
      const savedPK = await this.CustomerKeysModel.findOne({
        ownerId: account.id,
        isPrimary: true,
      }).exec();

      if (
        savedPK &&
        !(
          savedPK.type === passedPK.asAttribute.type &&
          savedPK.key === passedPK.asAttribute.key
        )
      ) {
        throw new HttpException(
          'Field selected as primary not corresponding to saved primary Key',
          HttpStatus.BAD_REQUEST
        );
      }

      const docs = await this.CustomerModel.aggregate([
        {
          $match: {
            ownerId: account.id,
          },
        },
        {
          $group: {
            _id: `$${passedPK.asAttribute.key}`,
            count: { $sum: 1 },
            docs: { $push: '$$ROOT' },
          },
        },
        {
          $match: {
            count: { $gt: 1 },
          },
        },
      ]).option({ allowDiskUse: true });

      if (!!docs?.length) {
        throw new HttpException(
          "Selected primary key can't be used cause it's value has duplicates among already existing users.",
          HttpStatus.BAD_REQUEST
        );
      }

      if (!savedPK && passedPK) {
        const afterSaveNewPK = await this.CustomerKeysModel.findOneAndUpdate(
          {
            ownerId: account.id,
            key: passedPK.asAttribute.key,
            type: passedPK.asAttribute.type,
          },
          {
            isPrimary: true,
          },
          {
            new: true,
          }
        ).exec();

        if (!afterSaveNewPK) {
          throw new HttpException(
            "Couldn't save selected primary key.",
            HttpStatus.BAD_REQUEST
          );
        }
      }

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

      await this.importsQueue.add('import', {
        fileData,
        clearedMapping,
        account,
        settings,
        passedPK,
        session,
        segmentId,
      });

      return;
    } catch (error) {
      this.error(error, this.countImportPreview.name, session);
      throw error;
    }
  }

  async updatePrimaryKey(
    account: Account,
    update: UpdatePK_DTO,
    session: string
  ) {
    const pk = (
      await this.CustomerKeysModel.findOne({
        isPrimary: true,
        ownerId: account.id,
      })
    )?.toObject();

    const docsDuplicates = await this.CustomerModel.aggregate([
      {
        $match: {
          ownerId: account.id,
        },
      },
      {
        $group: {
          _id: `$${update.key}`,
          count: { $sum: 1 },
          docs: { $push: '$$ROOT' },
        },
      },
      {
        $match: {
          count: { $gt: 1 },
        },
      },
    ])
      .option({ allowDiskUse: true })
      .limit(2);

    if (!!docsDuplicates?.length) {
      throw new HttpException(
        "Selected primary key can't be used because of duplicated or missing values. Primary key values must exist and be unique",
        HttpStatus.BAD_REQUEST
      );
    }

    const newPK = await this.CustomerKeysModel.findOne({
      ownerId: account.id,
      isPrimary: false,
      ...update,
    }).exec();

    if (!newPK) {
      throw new HttpException(
        'Passed attribute for new PK not exist, please check again or select another one.',
        HttpStatus.BAD_REQUEST
      );
    }

    let clientSession = await this.connection.startSession();
    await clientSession.startTransaction();

    try {
      const currentPK = await this.CustomerKeysModel.findOne({
        ownerId: account.id,
        isPrimary: true,
      })
        .session(clientSession)
        .exec();

      if (currentPK && currentPK._id.equals(newPK._id)) {
        currentPK.isPrimary = true;
      } else {
        if (currentPK) {
          currentPK.isPrimary = false;
          await currentPK.save({ session: clientSession });
        }

        newPK.isPrimary = true;
        await newPK.save({ session: clientSession });
      }
    } catch (error) {
      this.error(error, this.updatePrimaryKey.name, session);
      await clientSession.abortTransaction();
      throw new HttpException(
        'Error while performing operation, please try again.',
        HttpStatus.BAD_REQUEST
      );
    }
    await clientSession.commitTransaction();
    await clientSession.endSession();
  }
}
