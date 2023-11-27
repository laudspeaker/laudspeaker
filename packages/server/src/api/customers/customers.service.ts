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
import { DataSource, Repository } from 'typeorm';
import { EventDto } from '../events/dto/event.dto';
import {
  CustomerKeys,
  CustomerKeysDocument,
} from './schemas/customer-keys.schema';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { createClient } from '@clickhouse/client';
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
import * as _ from 'lodash';
import { randomUUID } from 'crypto';
import { StepsService } from '../steps/steps.service';

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

const KEYS_TO_SKIP = [
  '__v',
  '_id',
  'workflows',
  'journeys',
  'ownerId',
  'isFreezed',
];

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
    @InjectModel(Customer.name) public CustomerModel: Model<CustomerDocument>,
    @InjectModel(CustomerKeys.name)
    public CustomerKeysModel: Model<CustomerKeysDocument>,
    private dataSource: DataSource,
    private segmentsService: SegmentsService,
    @InjectRepository(Account)
    public accountsRepository: Repository<Account>,
    private readonly audiencesHelper: AudiencesHelper,
    private readonly audiencesService: AudiencesService,
    @Inject(WorkflowsService)
    private readonly workflowsService: WorkflowsService,
    @Inject(StepsService)
    private readonly stepsService: StepsService,
    @InjectConnection() private readonly connection: mongoose.Connection
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
    // this.CustomerModel.watch().on('change', async (data: any) => {
    //   try {
    //     const customerId = data?.documentKey?._id;
    //     if (!customerId) return;
    //     if (data.operationType === 'delete') {
    //       await this.deleteEverywhere(customerId.toString());
    //     } else {
    //       const customer = await this.CustomerModel.findById(customerId).exec();

    //       if (!customer?.ownerId) return;

    //       const account = await this.accountsRepository.findOneBy({
    //         id: customer.ownerId,
    //       });

    //       await this.segmentsService.updateAutomaticSegmentCustomerInclusion(
    //         account,
    //         customer,
    //         session
    //       );

    //       await this.recheckDynamicInclusion(account, customer, session);
    //     }
    //   } catch (e) {
    //     this.error(e, this.constructor.name, session);
    //   }
    // });
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

    delete newCustomerData.verified;
    delete newCustomerData.ownerId;
    delete newCustomerData._id;
    delete newCustomerData.__v;
    delete newCustomerData.audiences;
    delete newCustomerData.isFreezed;
    delete newCustomerData.id;
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

    const replacementRes = await this.CustomerModel.replaceOne(
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

        if (checkInSegment)
          info.isInsideSegment = await this.segmentsService.isCustomerMemberOf(
            account,
            checkInSegment,
            person.id
          );

        return info;
      })
    );

    return { data: listInfo, totalPages };
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

  async findById(
    account: Account,
    customerId: string
  ): Promise<
    Customer &
      mongoose.Document & {
        _id: Types.ObjectId;
      }
  > {
    if (!isValidObjectId(customerId))
      throw new BadRequestException('Invalid object id');

    const found = await this.CustomerModel.findById(customerId).exec();
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

  // TODO: optimize
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
    type?: string,
    isArray?: boolean
  ) {
    const attributes = await this.CustomerKeysModel.find({
      $and: [
        {
          key: RegExp(`.*${key}.*`, 'i'),
          ownerId: account.id,
          ...(type !== null ? { type } : {}),
          ...(isArray !== null ? { isArray } : {}),
        },
      ],
    })
      .limit(20)
      .exec();

    return attributes.map((el) => ({
      key: el.key,
      type: el.type,
      isArray: el.isArray,
    }));
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
}
