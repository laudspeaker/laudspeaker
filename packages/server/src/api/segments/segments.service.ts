import {
  ConflictException,
  forwardRef,
  HttpStatus,
  Inject,
  Injectable,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';
import { BadRequestException, HttpException } from '@nestjs/common/exceptions';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DataSource, In, Like, Not, QueryRunner, Repository } from 'typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { StepsHelper } from '../steps/steps.helper';
import { CustomersService } from '../customers/customers.service';
import { Customer } from '../customers/entities/customer.entity';
import { CreateSegmentDTO } from './dto/create-segment.dto';
import { UpdateSegmentDTO } from './dto/update-segment.dto';
import { SegmentCustomers } from './entities/segment-customers.entity';
import { Segment, SegmentType } from './entities/segment.entity';
import { CountSegmentUsersSizeDTO } from './dto/size-count.dto';
import { randomUUID } from 'crypto';
import * as Sentry from '@sentry/node';
import { QueueType } from '../../common/services/queue/types/queue-type';
import { Producer } from '../../common/services/queue/classes/producer';
import { CustomerKeysService } from '../customers/customer-keys.service';
import { Query, QueryService } from '../../common/services/query';
import { SegmentCustomersService } from './segment-customers.service';

@Injectable()
export class SegmentsService {
  constructor(
    private dataSource: DataSource,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(Segment) public segmentRepository: Repository<Segment>,
    @InjectRepository(SegmentCustomers)
    private segmentCustomersRepository: Repository<SegmentCustomers>,
    @InjectRepository(Customer)
    private customersRepository: Repository<Customer>,
    @Inject(forwardRef(() => CustomersService))
    private customersService: CustomersService,
    @Inject(forwardRef(() => CustomerKeysService))
    private customerKeysService: CustomerKeysService,
    private readonly stepsHelper: StepsHelper,
    private readonly queryService: QueryService,
    @Inject(SegmentCustomersService)
    private segmentCustomersService: SegmentCustomersService
  ) { }

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: SegmentsService.name,
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
        class: SegmentsService.name,
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
        class: SegmentsService.name,
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
        class: SegmentsService.name,
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
        class: SegmentsService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  public async findOne(
    account: Account,
    id: string,
    session: string,
    queryRunner?: QueryRunner
  ) {
    let segment: Segment;
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];
    if (queryRunner) {
      segment = await queryRunner.manager.findOneBy(Segment, {
        id,
        workspace_id: workspace.id,
      });
    } else {
      segment = await this.segmentRepository.findOneBy({
        id,
        workspace_id: workspace.id,
      });
    }

    if (!segment) throw new NotFoundException('Segment not found');

    return segment;
  }

  public async findAll(
    account: Account,
    take = 100,
    skip = 0,
    search = '',
    session: string
  ) {
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];
    const totalPages = Math.ceil(
      (await this.segmentRepository.count({
        where: {
          workspace_id: workspace.id,
        },
      })) / take || 1
    );
    const segments = await this.segmentRepository.find({
      where: {
        name: Like(`%${search}%`),
        workspace_id: workspace.id,
        type: Not(SegmentType.SYSTEM),
      },
      take: take < 100 ? take : 100,
      skip,
    });

    return { data: segments, totalPages };
  }

  /**
   * Get all segements for an account. Optionally filter by type
   * If @param type is undefined, return all types.
   * @returns
   */
  public async getSegments(
    account: Account,
    type: SegmentType | undefined,
    queryRunner: QueryRunner
  ) {
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    return await queryRunner.manager.find(Segment, {
      where: {
        workspace_id: workspace.id,
        ...(type ? { type: type } : {}),
      },
    });
  }

  async countSegmentCustomers(account: Account, id: any) {
    account = await this.customersService.accountsRepository.findOne({
      where: {
        id: account.id,
      },
      relations: ['teams.organization.workspaces'],
    });

    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    const segment = await this.segmentRepository.findOneBy({
      id,
      workspace_id: workspace.id,
    });
    if (!segment) throw new NotFoundException('Segment not found');

    return this.segmentCustomersRepository.countBy({
      segment_id: id,
    });
  }

  generateRandomString(length = 4): string {
    const characters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    const charactersLength = characters.length;

    for (let i = 0; i < length; i++) {
      result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }

    return result;
  }


  /*
   *
   * function to create intermediate mongo collection from segmentcustomers
   *
   * batched lookup and insert
   *
   * we may want to add an account filter in later
   * we may use this function in the plce of @getSegmentCustomers
   *
   */

  async getSegmentCustomersBatched(
    account: Account,
    session: string,
    segmentId: string,
    collectionName: string,
    batchSize: number
  ): Promise<string> {

    let processedCount = 0;
    //let batchSize = 500; // Or any suitable batch size

    // Find the total number of customers in the segment
    //const totalCustomers = await segmentCustomersRepository.count({ where: { segment_id: segmentId, owner: account } });
    // const totalCustomers = await this.segmentCustomersRepository.count({
    //   where: { segment: { id: segmentId } },
    // });

    const totalCustomers = await this.countSegmentCustomers(account, segmentId);

    while (processedCount < totalCustomers) {
      // Fetch a batch of SegmentCustomers
      const segmentCustomers = await this.segmentCustomersRepository.find({
        where: { segment: { id: segmentId } },
        skip: processedCount,
        take: batchSize,
      });

      // Convert SegmentCustomers to MongoDB documents
      let mongoDocuments = segmentCustomers.map((sc) => {
        return {
          _id: sc.customer.id,
        };
      });

      try {
        mongoDocuments = []; // Reset batch after insertion
      } catch (err) {
        //console.error('Error inserting documents:', err);
        this.error(
          err,
          this.getSegmentCustomersBatched.name,
          session,
          account.email
        );
        throw err;
      }

      // Update the count of processed customers
      processedCount += segmentCustomers.length;
    }

    return collectionName;
  }

  /*
   *
   */

  public async create(
    account: Account,
    createSegmentDTO: CreateSegmentDTO,
    session: string
  ) {
    if (
      createSegmentDTO.type === SegmentType.AUTOMATIC &&
      createSegmentDTO?.inclusionCriteria?.query?.statements?.length === 0
    ) {
      throw new HttpException(
        'At least one statement should be defined',
        HttpStatus.BAD_REQUEST
      );
    }
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    const organization = account.teams[0].organization;
    const organizationPlan = organization.plan;

    const segmentsCount = await this.segmentRepository.countBy({
      workspace_id: In(organization.workspaces.map((workspace) => workspace.id)),
    });

    if (organizationPlan.segmentLimit != -1) {
      if (segmentsCount + 1 > organizationPlan.segmentLimit) {
        throw new HttpException(
          'Segment limit has been exceeded',
          HttpStatus.PAYMENT_REQUIRED
        );
      }
    }

    let err;
    const queryRunner = await this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const segment = await queryRunner.manager.save(Segment, {
        ...createSegmentDTO,
        workspace_id: workspace.id,
        isUpdating: true,
      });
      if (segment.type === SegmentType.AUTOMATIC) {
        await Producer.add(QueueType.SEGMENT_UPDATE, {
          segment,
          createSegmentDTO,
          account,
        }, 'createDynamic');
      }
      await queryRunner.commitTransaction();
      return segment;
    } catch (e) {
      this.error(e, this.create.name, session, account.email);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get size of the segment
   * to do make AND query faster.
   * @param account
   * @param query
   * @returns {size: size of segment, total: total num of users}
   */
  public async size(
    account: Account,
    createSegmentDTO: CountSegmentUsersSizeDTO,
    session: string
  ) {
    return Sentry.startSpan({ name: 'SegmentsService.size' }, async () => {
      this.debug(
        `SegmentDTO is: ${JSON.stringify(
          createSegmentDTO.inclusionCriteria.query.type,
          null,
          2
        )}`,
        this.size.name,
        session,
        account.id
      );

      const totalCount = await this.customersService.customersSize(
        account,
        session
      );

      const workspaceId = account?.teams?.[0]?.organization?.workspaces?.[0]?.id;

      const query = Query.fromJSON(createSegmentDTO);
      query.setContext({
        workspace_id: workspaceId
      });

      this.debug(
        `Query SQL: ${query.toSQL()}`,
        this.size.name,
        session,
        account.id
      );

      const customerCount = await query.count(this.dataSource);

      return { size: customerCount, total: totalCount };
    });
  }

  public async update(
    account: Account,
    id: string,
    updateSegmentDTO: UpdateSegmentDTO,
    session: string
  ) {
    const segment = await this.findOne(account, id, session);
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    if (segment.isUpdating) {
      throw new BadRequestException(
        'The segment is still updating. Please, try later'
      );
    }

    await this.segmentRepository.update(
      { id, workspace_id: workspace.id },
      { ...updateSegmentDTO, workspace_id: workspace.id, isUpdating: true }
    );

    await Producer.add(QueueType.SEGMENT_UPDATE, {
      account,
      id,
      updateSegmentDTO,
      session,
      workspace,
    }, 'updateDynamic');
  }

  public async delete(account: Account, id: string, session: string) {
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    await this.segmentRepository.delete({
      id,
      workspace_id: workspace.id,
    });
  }

  public async getCustomers(
    account: Account,
    id: any,
    take = 100,
    skip = 0,
    createdAtSortType: 'asc' | 'desc' = 'asc',
    session: string
  ) {
    const segment = await this.findOne(account, id, session);

    const totalPages = Math.ceil(
      (await this.segmentCustomersRepository.count({
        where: {
          segment_id: id,
        },
      })) / take || 1
    );

    const records = await this.segmentCustomersRepository.find({
      where: {
        segment_id: id,
      },
      take: take < 100 ? take : 100,
      skip,
    });

    const customerIds = records.map(record => record.customer.id);

    const customers = await this.customersRepository.find({
      where: {
        id: In(customerIds),
      },
      order: {
        id: createdAtSortType === 'asc' ? 'ASC' : 'DESC',
      },
    });

    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    const pk =
      await this.customerKeysService.getPrimaryKey(workspace.id,session);
    return {
      data: customers,
      totalPages,
      pkName: pk?.name,
    };
  }

  /**
   * Goes through all account segments and updates membership of the DYNAMIC segments
   * based on the customer's attributes.
   * @returns object with two arrays of segments indicating where the customer was added/removed
   *
   * skips manual segments
   *
   */
  public async updateCustomerSegments(
    account: Account,
    customerId: string,
    session: string,
    queryRunner: QueryRunner
  ) {
    const addedToSegments: Segment[] = [];
    const removedFromSegments: Segment[] = [];
    const segments = await this.getSegments(account, undefined, queryRunner);
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    for (const segment of segments) {
      try {
        // We skip manual segments and empty inclusion criteria
        if (segment.type && (segment.type === 'manual' || segment.isUpdating)) {
          continue;
        }
        if (
          segment.inclusionCriteria &&
          Object.keys(segment.inclusionCriteria).length === 0
        ) {
          //to do check
          this.debug(
            `inclusion empty`,
            this.updateCustomerSegments.name,
            session,
            account.id
          );
        }

        const doInclude = await this.customersService.checkCustomerMatchesQuery(
          segment.inclusionCriteria.query,
          account,
          session,
          undefined,
          customerId
        );
        const isMemberOf = await this.segmentCustomersService.isCustomerInSegment(
          workspace.id,
          segment.id,
          customerId
        );

        if (doInclude && !isMemberOf) {
          // If should include but not a member of, then add
          await this.addCustomerToSegment(
            account,
            segment.id,
            customerId,
            session,
            queryRunner
          );
          addedToSegments.push(segment);
        } else if (!doInclude && isMemberOf) {
          // If should not include but is a member of, then remove
          await this.removeCustomerFromSegment(
            segment.id,
            customerId,
            queryRunner
          );
          removedFromSegments.push(segment);
        }
      } catch (e) {
        //to do should do something else with the error as well
        this.debug(
          `segment issue is on: ${JSON.stringify(segment, null, 2)}`,
          this.updateCustomerSegments.name,
          session,
          account.id
        );
        this.debug(
          `customer issue is with: ${customerId}`,
          this.updateCustomerSegments.name,
          session,
          account.id
        );
        this.error(e, this.updateCustomerSegments.name, session);
      }
    }
    return { added: addedToSegments, removed: removedFromSegments };
  }

  private containsEventNameWithValue(obj, key, value) {
    if (typeof obj !== 'object' || obj === null) {
      return false;
    }

    if (Array.isArray(obj)) {
      return obj.some((item) =>
        this.containsEventNameWithValue(item, key, value)
      );
    }

    for (const k in obj) {
      if (k === key && obj[k] === value) {
        return true;
      }
      if (typeof obj[k] === 'object') {
        if (this.containsEventNameWithValue(obj[k], key, value)) {
          return true;
        }
      }
    }

    return false;
  }

  public async updateCustomerSegmentsUsingEvent(
    account: Account,
    event: any,
    customerId: string,
    session: string,
    queryRunner: QueryRunner
  ) {
    const addedToSegments: Segment[] = [];
    const removedFromSegments: Segment[] = [];
    const segments = await this.getSegments(account, undefined, queryRunner);
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    for (const segment of segments) {
      // We skip manual segments and empty inclusion criteria
      if (segment.type && (segment.type === 'manual' || segment.isUpdating)) {
        continue;
      }
      if (
        segment.inclusionCriteria &&
        Object.keys(segment.inclusionCriteria).length === 0
      ) {
        continue;
      }
      if (
        !this.containsEventNameWithValue(
          segment.inclusionCriteria,
          'eventName',
          event.event
        )
      ) {
        continue;
      }

      const doInclude = await this.customersService.checkCustomerMatchesQuery(
        segment.inclusionCriteria.query,
        account,
        session,
        undefined,
        customerId
      );
      const isMemberOf = await this.segmentCustomersService.isCustomerInSegment(
        workspace.id,
        segment.id,
        customerId,
      );

      if (doInclude && !isMemberOf) {
        // If should include but not a member of, then add
        await this.addCustomerToSegment(
          account,
          segment.id,
          customerId,
          session,
          queryRunner
        );
        addedToSegments.push(segment);
      } else if (!doInclude && isMemberOf) {
        // If should not include but is a member of, then remove
        await this.removeCustomerFromSegment(
          segment.id,
          customerId,
          queryRunner
        );
        removedFromSegments.push(segment);
      }
    }
    return { added: addedToSegments, removed: removedFromSegments };
  }

  /**
   * Add customer to segment record if not already exists.
   */
  public async addCustomerToSegment(
    account: Account,
    segmentId: any,
    customerId: string,
    session: string,
    queryRunner: QueryRunner
  ) {
    /*
    const segment = await this.findOne(
      account,
      segmentId,
      session,
      queryRunner
    );
    */
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    const foundRecord = await queryRunner.manager.findOneBy(SegmentCustomers, {
      segment_id: segmentId,
      customer_id: customerId,
      workspace_id: workspace.id,
    });

    if (foundRecord)
      throw new ConflictException('Customer already in this segment');

    await this.segmentCustomersRepository
        .createQueryBuilder()
        .insert()
        // explicitly use the column names otherwise
        // typeorm duplicates these columns and produces
        // column specified more than once error
        .into(SegmentCustomers, ["customer_id", "segment_id", "workspace_id"])
        .values([{
          segment_id: segmentId,
          customer_id: customerId,
          workspace_id: workspace.id,
        }])
        .execute();
  }

  public async removeCustomerFromSegment(
    segmentId: string,
    customerId: string,
    queryRunner: QueryRunner
  ) {
    await queryRunner.manager.delete(SegmentCustomers, {
      segment_id: segmentId, //{ id: segmentId },
      customerId,
    });
  }

  /**
   * Handles unassigning a customer from all segments.
   */
  public async removeCustomerFromAllSegments(
    customerId: string,
    queryRunner: QueryRunner
  ) {
    await queryRunner.manager.delete(SegmentCustomers, {
      customerId,
    });
  }

  public async assignCustomer(
    account: Account,
    id: string,
    customerId: string,
    session: string
  ) {
    const segment = await this.findOne(account, id, session);
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    const foundRecord = await this.segmentCustomersRepository.findOneBy({
      segment_id: segment.id,
      customer_id: customerId,
    });

    if (foundRecord)
      throw new ConflictException('Customer already in this segment');

    await this.segmentCustomersRepository.save({
      segment_id: segment.id,
      customerId,
      workspace,
    });
  }

  public async assignCustomers(
    account: Account,
    id: string,
    customerIds: string[],
    session: string
  ) {
    for (const customerId of customerIds) {
      try {
        await this.assignCustomer(account, id, customerId, session);
      } catch (e) {
        this.logger.error(e);
      }
    }
  }

  public async updateSegmentCustomersBatched(
    collectionName: string,
    account: Account,
    segmentId: string,
    session: string,
    queryRunner: QueryRunner,
    batchSize = 500 // default batch size
  ) {
    // Start transaction
    //await queryRunner.startTransaction();

    const segment = await this.findOne(
      account,
      segmentId,
      session,
      queryRunner
    );
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    // Delete existing customers in the segment
    await queryRunner.manager.getRepository(SegmentCustomers).delete({
      segment_id: segmentId,
      workspace_id: workspace.id,
    });


    let processedCount = 0;

    // Commit transaction
    //await queryRunner.commitTransaction();
  }

  public async putCustomers(
    account: Account,
    id: string,
    customerIds: string[],
    session: string
  ) {
    const segment = await this.findOne(account, id, session);
    await this.clearCustomers(account, id, session);
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    return this.segmentCustomersRepository.save(
      customerIds.map((customerId) => ({
        segment_id: segment.id,
        customer_id: customerId,
        workspace_id: workspace.id,
      }))
    );
  }

  public async clearCustomers(account: Account, id: string, session: string) {
    const segment = await this.findOne(account, id, session);
    if (!segment) {
      throw new HttpException('No segment found.', HttpStatus.NOT_FOUND);
    }
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    await this.segmentCustomersRepository.delete({
      segment_id: segment.id,
      workspace_id: workspace.id
    });
  }

  public async deleteBatchedCustomers(
    account: Account,
    id: string,
    customerIds: string[],
    session: string
  ) {
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    await this.segmentCustomersRepository.delete({
      segment_id: id,
      customer_id: In(customerIds),
      workspace_id: workspace.id
    });
  }

  public async deleteCustomer(
    account: Account,
    id: string,
    customerId: string,
    session: string
  ) {
    const segment = await this.findOne(account, id, session);

    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    await this.segmentCustomersRepository.delete({
      segment_id: segment.id,
      customer_id: customerId,
      workspace_id: workspace.id
    });
  }

  public async deleteCustomerFromAllAutomaticSegments(
    account: Account,
    customerId: string
  ) {
    /*
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    await this.segmentCustomersRepository.delete({
      segment:{type:SegmentType.AUTOMATIC},
      customerId: customerId,
      workspace: {id:workspace.id}
    })
    */
    /*
    await this.segmentCustomersRepository
      .createQueryBuilder()
      .delete()
      .where(
        `segment_customers."id" in (select sc.id from public.segment_customers as sc 
          left join Segment as seg on sc."segmentId" = seg."id" 
          where seg."ownerId" = :ownerId
            and sc."customerId" = :customerId
            and seg."type" = 'automatic')`,
        {
          ownerId: account.id,
          customerId,
        }
      )
      .execute();
    */
  }

  public async duplicate(account: Account, id: string, session: string) {
    const { name, description, type, inclusionCriteria, resources } =
      await this.findOne(account, id, session);

    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    return this.segmentRepository.save({
      name,
      description,
      type,
      inclusionCriteria,
      resources,
      workspace_id: workspace.id,
    });
  }

  public async loadCSVToManualSegment(
    account: Account,
    id: string,
    csvFile: Express.Multer.File,
    session: string
  ) {
    const segment = await this.findOne(account, id, session);

    if (segment.type !== SegmentType.MANUAL)
      throw new BadRequestException("This segment isn't manual");

    await Producer.add(QueueType.SEGMENT_UPDATE, {
      account,
      segment,
      csvFile,
      session,
    }, 'updateManual');

    return;
  }

  public async updateAutomaticSegmentCustomerInclusion(
    account: Account,
    customer: Customer,
    session: string
  ) {
    await this.deleteCustomerFromAllAutomaticSegments(account, customer.id.toString());
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    const segments = await this.segmentRepository.findBy({
      workspace_id: workspace.id,
      type: SegmentType.AUTOMATIC,
    });

    for (const segment of segments) {
      try {
        if (
          await this.stepsHelper.checkInclusion(
            customer,
            segment.inclusionCriteria,
            session
          )
        )
          await this.assignCustomer(account, segment.id, customer.id.toString(), session);
      } catch (e) {
        this.logger.error(e);
      }
    }
  }
}
