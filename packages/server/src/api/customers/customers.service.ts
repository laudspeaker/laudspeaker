/* eslint-disable no-case-declarations */
import mongoose, { isValidObjectId, Model, Types } from 'mongoose';
import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  LoggerService,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Customer, CustomerDocument } from './schemas/customer.schema';
import { CreateCustomerDto } from './dto/create-customer.dto';
import mockData from '../../fixtures/mockData';
import { Account } from '../accounts/entities/accounts.entity';
import { Audience } from '../audiences/entities/audience.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Any, DataSource, In, Repository } from 'typeorm';
import { checkInclusion } from '../audiences/audiences.helper';
import { EventDto } from '../events/dto/event.dto';
import {
  CustomerKeys,
  CustomerKeysDocument,
} from './schemas/customer-keys.schema';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { createClient } from '@clickhouse/client';
import { Workflow } from '../workflows/entities/workflow.entity';
import { attributeConditions } from '@/fixtures/attributeConditions';

export type Correlation = {
  cust: CustomerDocument;
  found: boolean;
};

const eventsMap = {
  sent: 'delivered',
  clicked: 'clicked',
};

@Injectable()
export class CustomersService {
  private clickhouseClient = createClient({
    host: process.env.CLICKHOUSE_HOST ?? 'http://localhost:8123',
    username: process.env.CLICKHOUSE_USER ?? 'default',
    password: process.env.CLICKHOUSE_PASSWORD ?? '',
  });

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectQueue('customers') private readonly customersQueue: Queue,
    @InjectModel(Customer.name) public CustomerModel: Model<CustomerDocument>,
    @InjectModel(CustomerKeys.name)
    private CustomerKeysModel: Model<CustomerKeysDocument>,
    @InjectRepository(Audience)
    private audiencesRepository: Repository<Audience>,
    @InjectRepository(Workflow)
    private workflowsRepository: Repository<Workflow>,
    private dataSource: DataSource
  ) {}

  async create(
    account: Account,
    createCustomerDto: CreateCustomerDto
  ): Promise<
    Customer &
      mongoose.Document<any, any, any> & {
        _id: Types.ObjectId;
      }
  > {
    const createdCustomer = new this.CustomerModel({
      ownerId: (<Account>account).id,
      ...createCustomerDto,
    });
    const ret = await createdCustomer.save();
    // Already started (isEditable = false), dynamic (isDyanmic = true),push
    // Not started (isEditable = true), dynamic (isDyanmic = true), push
    const dynamicWkfs = await this.workflowsRepository.find({
      where:{
        ownerId: (<Account>account).id,
        isDynamic: true,
      },
      relations:['segment']
    });
    for (let index = 0; index < dynamicWkfs.length; index++) {
      const workflow = dynamicWkfs[index];
      if (checkInclusion(ret, workflow.segment.inclusionCriteria)) {
        const audiences = await Promise.all(
          workflow.audiences.map((item) =>
            this.audiencesRepository.findOneBy({ id: item })
          )
        );

        const primaryAudience = audiences.find(
          (audience) => audience.isPrimary
        );

        await this.audiencesRepository.update(
          { ownerId: (<Account>account).id, id: primaryAudience.id },
          {
            customers: primaryAudience.customers.concat(ret.id),
          }
        );
      }
    }
    // Already started(isEditable = true), static(isDyanmic = false), don't push
    // Not started(isEditable = false), static(isDyanmic = false), push
    const staticWkfs = await this.workflowsRepository.find({
      where:{
        ownerId: (<Account>account).id,
        isDynamic: false,
      },
      relations:['segment']
    });
    for (let index = 0; index < staticWkfs.length; index++) {
      const workflow = staticWkfs[index];
      if (checkInclusion(ret, workflow.segment.inclusionCriteria)) {
        const audiences = await Promise.all(
          workflow.audiences.map((item) =>
            this.audiencesRepository.findOneBy({ id: item, isEditable: false })
          )
        );

        const primaryAudience = audiences.find((item) => item.isPrimary);

        await this.audiencesRepository.update(
          { ownerId: (<Account>account).id, id: primaryAudience.id },
          {
            customers: primaryAudience.customers.concat(ret.id),
          }
        );
      }
    }

    return ret;
  }

  async addPhCustomers(data: any, account: Account) {
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
      const ret = await createdCustomer.save();
    }
  }

  async findAll(
    account: Account,
    take = 100,
    skip = 0
  ): Promise<{ data: CustomerDocument[]; totalPages: number }> {
    const totalPages =
      Math.ceil(
        (await this.CustomerModel.count({
          ownerId: (<Account>account).id,
        }).exec()) / take
      ) || 1;
    const customers = await this.CustomerModel.find({
      ownerId: (<Account>account).id,
    })
      .skip(skip)
      .limit(take <= 100 ? take : 100)
      .exec();
    return { data: customers, totalPages };
  }

  async findOne(account: Account, id: string) {
    if (!isValidObjectId(id))
      throw new HttpException('Id is not valid', HttpStatus.BAD_REQUEST);

    const customer = await this.CustomerModel.findOne({
      _id: new Types.ObjectId(id),
      ownerId: account.id,
    }).exec();
    if (!customer)
      throw new HttpException('Person not found', HttpStatus.NOT_FOUND);
    return {
      ...customer.toObject<mongoose.LeanDocument<CustomerDocument>>(),
      _id: id,
    };
  }

  async findCustomerEvents(account: Account, customerId: string) {
    await this.findOne(account, customerId);
    const response = await this.clickhouseClient.query({
      query: `SELECT audienceId, event, createdAt FROM message_status WHERE customerId = {customerId:String} LIMIT 4`,
      query_params: { customerId },
    });
    const data = (
      await response.json<{
        data: { audienceId: string; event: string; createdAt: string }[];
      }>()
    )?.data;

    const result = await Promise.all(
      data.map(async (el) => {
        const query = await this.dataSource
          .createQueryBuilder(Workflow, 'workflow')
          .select('workflow.id, workflow.name, audience.name as audname')
          .where(':id=ANY(audiences)', {
            id: el.audienceId,
          })
          .leftJoin('audience', 'audience', 'audience.id = :id', {
            id: el.audienceId,
          })
          .execute();
        return {
          ...el,
          ...(query?.[0] || {}),
        };
      })
    );

    return result;
  }

  async update(
    account: Account,
    id: string,
    updateCustomerDto: Record<string, unknown>
  ) {
    const { ...newCustomerData } = updateCustomerDto;

    delete newCustomerData.verified;
    delete newCustomerData.ownerId;
    delete newCustomerData._id;
    delete newCustomerData.__v;
    const customer = await this.findOne(account, id);

    if (customer.ownerId != account.id) {
      throw new HttpException("You can't update this customer.", 400);
    }

    const newCustomer = Object.fromEntries(
      Object.entries({
        ...customer,
        ...newCustomerData,
      }).filter(([_, v]) => v != null)
    );

    await this.CustomerModel.replaceOne(customer, newCustomer).exec();

    return newCustomerData;
  }

  async returnAllPeopleInfo(account: Account, take = 100, skip = 0) {
    const { data, totalPages } = await this.findAll(
      <Account>account,
      take,
      skip
    );
    const listInfo = data.map((person) => {
      const info = {};
      (info['id'] = person['_id'].toString()),
        (info['salient'] = person['email']
          ? person['email']
          : person['slackEmail']
          ? person['slackEmail']
          : person['slackRealName']
          ? person['slackRealName']
          : '...');
      return info;
    });
    return { data: listInfo, totalPages };
  }

  async findAudienceStatsCustomers(
    account: Account,
    take = 100,
    skip = 0,
    event?: string,
    audienceId?: string
  ) {
    if (eventsMap[event] && audienceId) {
      const response = await this.clickhouseClient.query({
        query: `SELECT customerId FROM message_status WHERE audienceId = {audienceId:UUID} AND event = {event:String} ORDER BY createdAt LIMIT {take:Int32} OFFSET {skip:Int32}`,
        query_params: { audienceId, event: eventsMap[event], take, skip },
      });
      const data = (await response.json<{ data: { customerId: string }[] }>())
        ?.data;
      const customerIds = data?.map((item) => item.customerId) || [];

      return Promise.all(
        customerIds.map(async (id) =>
          (await this.findById(account, id)).toObject()
        )
      );
    }
  }

  async ingestPosthogPersons(
    proj: string,
    phAuth: string,
    phUrl: string,
    account: Account
  ) {
    let posthogUrl: string;
    if (phUrl[phUrl.length - 1] == '/') {
      posthogUrl = phUrl + 'api/projects/' + proj + '/persons/';
    } else {
      posthogUrl = phUrl + '/api/projects/' + proj + '/persons/';
    }
    const authString = 'Bearer ' + phAuth;
    try {
      const job = await this.customersQueue.add({
        url: posthogUrl,
        auth: authString,
        account: account,
      });
    } catch (e) {
      this.logger.error('Error: ' + e);
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
      mongoose.Document<any, any, any> & {
        _id: Types.ObjectId;
      }
  > {
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

  async findBySpecifiedEvent(
    account: Account,
    correlationKey: string,
    correlationValue: string | [],
    event: any,
    mapping?: (event: any) => any
  ): Promise<Correlation> {
    // const queryParam: any = {
    //   ownerId: (<Account>account).id,
    //   [correlationKey]: correlationValue,
    // };
    // let customer: CustomerDocument = await this.CustomerModel.findOne(
    //   queryParam
    // ).exec();
    // if (customer) {
    //   if (mapping) {
    //     customer = await this.CustomerModel.findOneAndUpdate(
    //       queryParam,
    //       mapping(event)
    //     ).exec();
    //     this.logger.debug('Customer found and updated: ' + JSON.stringify(customer));
    //     return { cust: customer, found: true };
    //   } else {
    //     this.logger.debug('Customer found, no update needed: ' + customer.id);
    //     return { cust: customer, found: true };
    //   }
    // } else {
    //   if (mapping)
    //     customer = await this.CustomerModel.findOneAndUpdate(
    //       queryParam,
    //       mapping(event),
    //       { upsert: true }
    //     ).exec();
    //   else
    //     customer = await this.CustomerModel.findOneAndUpdate(
    //       queryParam,
    //       undefined,
    //       { upsert: true }
    //     ).exec();
    //   return { cust: customer, found: false };
    // }
    let customer: CustomerDocument;
    const queryParam = {
      ownerId: (<Account>account).id,
      [correlationKey]: correlationValue,
    };
    this.logger.debug('QueryParam: ' + JSON.stringify(queryParam));
    customer = await this.CustomerModel.findOne(queryParam).exec();
    if (!customer) {
      this.logger.debug('Customer not found, creating new customer...');
      if (mapping) {
        const newCust = mapping(event);
        newCust['ownerId'] = (<Account>account).id;
        newCust[correlationKey] = [correlationValue];
        const createdCustomer = new this.CustomerModel(newCust);
        this.logger.debug('New customer created: ' + createdCustomer.id);
        return { cust: await createdCustomer.save(), found: false };
      } else {
        const createdCustomer = new this.CustomerModel({
          ownerId: (<Account>account).id,
          correlationKey: correlationValue,
        });
        this.logger.debug('New customer created: ' + createdCustomer.id);
        return { cust: await createdCustomer.save(), found: false };
      }

      //to do cant just return [0] in the future
    } else {
      if (mapping)
        customer = await this.CustomerModel.findOneAndUpdate(
          queryParam,
          mapping(event)
        ).exec();
      this.logger.debug('Customer found: ' + customer.id);
      return { cust: customer, found: true };
    }
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
  async findByInclusionCriteria(
    account: Account,
    criteria: any
  ): Promise<CustomerDocument[]> {
    let customers: CustomerDocument[] = [];
    const ret: CustomerDocument[] = [];
    try {
      customers = (await this.findAll(account)).data;
    } catch (err) {
      return Promise.reject(err);
    }
    customers.forEach((customer) => {
      if (checkInclusion(customer, criteria)) ret.push(customer);
    });
    return Promise.resolve(ret);
  }

  checkInclusion(customer: CustomerDocument, inclusionCriteria: any): boolean {
    return checkInclusion(customer, inclusionCriteria);
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
    correlationValue: string | []
  ): Promise<CustomerDocument> {
    let customer: CustomerDocument; // Found customer
    const queryParam = {
      ownerId: (<Account>account).id,
      [correlationKey]: correlationValue,
    };
    try {
      customer = await this.CustomerModel.findOne(queryParam).exec();
      this.logger.debug('Found customer in correlationKVPair:' + customer.id);
    } catch (err) {
      return Promise.reject(err);
    }
    return Promise.resolve(customer);
  }

  async findOrCreateByCorrelationKVPair(
    account: Account,
    dto: EventDto
  ): Promise<Correlation> {
    let customer: CustomerDocument; // Found customer
    const queryParam = { ownerId: (<Account>account).id };
    queryParam[dto.correlationKey] = dto.correlationValue;
    try {
      customer = await this.CustomerModel.findOne(queryParam).exec();
    } catch (err) {
      return Promise.reject(err);
    }
    if (!customer) {
      const createdCustomer = new this.CustomerModel(queryParam);
      return { cust: await createdCustomer.save(), found: false };
    } else return { cust: customer, found: true };
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

  async removeById(custId: string) {
    const cust = await this.CustomerModel.findById(custId);
    await this.CustomerModel.remove(cust);
  }

  async getAttributes(resourceId: string) {
    const attributes = await this.CustomerKeysModel.find().exec();
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

    return (
      mockData.resources.find((resource) => resource.id === resourceId) || {}
    );
  }
}
