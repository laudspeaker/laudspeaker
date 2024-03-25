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
import { DataSource, In, Like, QueryRunner, Repository } from 'typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { AudiencesHelper } from '../audiences/audiences.helper';
import { CustomersService } from '../customers/customers.service';
import { CustomerDocument } from '../customers/schemas/customer.schema';
import { WorkflowsService } from '../workflows/workflows.service';
import { CreateSegmentDTO } from './dto/create-segment.dto';
import { UpdateSegmentDTO } from './dto/update-segment.dto';
import { SegmentCustomers } from './entities/segment-customers.entity';
import { Segment, SegmentType } from './entities/segment.entity';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose, { Types } from 'mongoose';
import e, { query } from 'express';
import { CountSegmentUsersSizeDTO } from './dto/size-count.dto';
import { randomUUID } from 'crypto';
import { Filter, Document } from 'mongodb';

@Injectable()
export class SegmentsService {
  constructor(
    private dataSource: DataSource,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(Segment) public segmentRepository: Repository<Segment>,
    @InjectRepository(SegmentCustomers)
    private segmentCustomersRepository: Repository<SegmentCustomers>,
    @Inject(forwardRef(() => CustomersService))
    private customersService: CustomersService,
    private workflowsService: WorkflowsService,
    private readonly audiencesHelper: AudiencesHelper,
    @InjectConnection() private readonly connection: mongoose.Connection
  ) {}

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
        workspace: {
          id: workspace.id,
        },
      });
    } else {
      segment = await this.segmentRepository.findOneBy({
        id,
        workspace: {
          id: workspace.id,
        },
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
          workspace: {
            id: workspace.id,
          },
        },
      })) / take || 1
    );
    const segments = await this.segmentRepository.find({
      where: {
        name: Like(`%${search}%`),
        workspace: {
          id: workspace.id,
        },
      },
      take: take < 100 ? take : 100,
      skip,
    });

    return { data: segments, totalPages };
  }

  async findAllSegmentsForCustomer(
    account: Account,
    id: string,
    take = 100,
    skip = 0,
    search = '',
    session: string
  ) {
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    const totalPages = Math.ceil(
      (await this.segmentCustomersRepository.count({
        where: {
          workspace: {
            id: workspace.id,
          },
          customerId: id,
        },
      })) / take || 1
    );

    const records = await this.segmentCustomersRepository.find({
      where: {
        workspace: {
          id: workspace.id,
        },
        customerId: id,
      },
      take: take < 100 ? take : 100,
      skip,
      relations: ['segment'],
    });

    const segments = records.map((record) => record.segment);
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
        workspace: { id: workspace.id },
        ...(type ? { type: type } : {}),
      },
    });
  }

  /*
   * Helper function for customers.service getCusotmersFromsegment()
   */
  //to do add account filter on records, later
  async getSegmentCustomers(
    account: Account,
    session: string,
    segmentId: string,
    collectionName: string
  ) {
    const records = await this.segmentCustomersRepository.findBy({
      segment: segmentId,
    });
    const collectionHandle = this.connection.db.collection(collectionName);

    for (const record of records) {
      const customerId = record.customerId; // Assuming customerId is a field in record
      // Update the collection: increment the count for this customerId
      const objectId = customerId;
      await collectionHandle.updateOne(
        { _id: objectId } as unknown as Filter<Document>,
        { $setOnInsert: { _id: objectId } },
        { upsert: true }
      );
    }

    return collectionName;
  }

  async countSegmentCustomers(account: Account, id: string) {
    account = await this.customersService.accountsRepository.findOne({
      where: {
        id: account.id,
      },
      relations: ['teams.organization.workspaces'],
    });

    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    const segment = await this.segmentRepository.findOneBy({
      id,
      workspace: { id: workspace.id },
    });
    if (!segment) throw new NotFoundException('Segment not found');

    return this.segmentCustomersRepository.countBy({ segment: segment.id });
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
   * Garbage collector for mongo collections!
   */

  //to do add part that filters out list of important dbs
  //to do add debugs
  async deleteCollectionsWithPrefix(prefix: string): Promise<void> {
    try {
      const collections = await this.connection.db.listCollections().toArray();

      // Filter collections that start with the given prefix
      const collectionsToDelete = collections
        .filter((collection) => collection.name.startsWith(prefix))
        .map((collection) => collection.name);

      // Delete each collection
      for (const collectionName of collectionsToDelete) {
        //toggle for testing segments
        await this.connection.db.collection(collectionName).drop();
      }
    } catch (error) {
      const session = randomUUID();
      this.error(error, this.deleteCollectionsWithPrefix.name, session);
    }
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
    const mongoCollection = this.connection.db.collection(collectionName);

    let processedCount = 0;
    //let batchSize = 500; // Or any suitable batch size

    // Find the total number of customers in the segment
    //const totalCustomers = await segmentCustomersRepository.count({ where: { segment: segmentId, owner: account } });
    const totalCustomers = await this.segmentCustomersRepository.count({
      where: { segment: segmentId },
    });

    while (processedCount < totalCustomers) {
      // Fetch a batch of SegmentCustomers
      const segmentCustomers = await this.segmentCustomersRepository.find({
        where: { segment: segmentId },
        skip: processedCount,
        take: batchSize,
      });

      // Convert SegmentCustomers to MongoDB documents
      let mongoDocuments = segmentCustomers.map((sc) => {
        return {
          //_id: new Types.ObjectId(sc.customerId),
          _id: sc.customerId,
          //_id: new ObjectId(sc.customerId), // Assuming customerId is stored in string format
          // Add other properties if needed
        };
      });

      try {
        const result = await mongoCollection.insertMany(
          mongoDocuments as unknown[]
        );
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
   * function to add customers from mongo collection to segmentcustomers table
   */

  async addCustomersToSegment(
    collectionName: string,
    batchSize: number,
    segmentId: string,
    account: Account,
    queryRunner: QueryRunner
  ): Promise<void> {
    const mongoCollection = this.connection.db.collection(collectionName);

    let processedCount = 0;
    const totalDocuments = await mongoCollection.countDocuments();
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    while (processedCount < totalDocuments) {
      // Fetch a batch of documents
      const customerDocuments = await mongoCollection
        .find({})
        .skip(processedCount)
        .limit(batchSize)
        .toArray();
      // Map the MongoDB documents to SegmentCustomers entities
      const segmentCustomersArray: SegmentCustomers[] = customerDocuments.map(
        (doc) => {
          const segmentCustomer = new SegmentCustomers();
          segmentCustomer.customerId = doc._id.toString();
          segmentCustomer.segment = segmentId;
          segmentCustomer.workspace = workspace;
          // Set other properties as needed
          return segmentCustomer;
        }
      );
      // Batch insert into PostgreSQL database
      await queryRunner.manager.save(SegmentCustomers, segmentCustomersArray);
      // Update the count of processed documents
      processedCount += customerDocuments.length;
    }
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

    let err;
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    try {
      const segment = await queryRunner.manager.save(Segment, {
        ...createSegmentDTO,
        workspace: { id: workspace.id },
      });

      this.debug(
        `SegmentDTO is: ${createSegmentDTO}`,
        this.create.name,
        session,
        account.id
      );

      // this.customersService.createSegmentQuery(createSegmentDTO.inclusionCriteria.query);
      if (segment.type === SegmentType.AUTOMATIC) {
        const collectionPrefix = this.generateRandomString();
        const customersInSegment =
          await this.customersService.getSegmentCustomersFromQuery(
            createSegmentDTO.inclusionCriteria.query,
            account,
            session,
            true,
            0,
            collectionPrefix
          );

        this.debug(
          `we have customersInSegment: ${customersInSegment}`,
          this.create.name,
          session,
          account.id
        );

        const batchSize = 500; // Set an appropriate batch size
        const collectionName = customersInSegment; // Name of the MongoDB collection
        const mongoCollection = this.connection.db.collection(collectionName);

        let processedCount = 0;
        const totalDocuments = await mongoCollection.countDocuments();

        while (processedCount < totalDocuments) {
          // Fetch a batch of documents
          const customerDocuments = await mongoCollection
            .find({})
            .skip(processedCount)
            .limit(batchSize)
            .toArray();
          // Map the MongoDB documents to SegmentCustomers entities
          const segmentCustomersArray: SegmentCustomers[] =
            customerDocuments.map((doc) => {
              const segmentCustomer = new SegmentCustomers();
              segmentCustomer.customerId = doc._id.toString();
              segmentCustomer.segment = segment.id;
              segmentCustomer.workspace =
                account?.teams?.[0]?.organization?.workspaces?.[0];
              // Set other properties as needed
              return segmentCustomer;
            });
          // Batch insert into PostgreSQL database
          await queryRunner.manager.save(
            SegmentCustomers,
            segmentCustomersArray
          );
          // Update the count of processed documents
          processedCount += customerDocuments.length;
        }

        try {
          await this.deleteCollectionsWithPrefix(collectionPrefix);
        } catch (e) {
          this.error(e, this.create.name, session, account.id);
        }
      }
      await queryRunner.commitTransaction();
      return segment;
    } catch (e) {
      err = e;
      this.error(e, this.create.name, session, account.email);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
      if (err) {
        throw err;
      }
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

    if (createSegmentDTO.inclusionCriteria.query.type === 'any') {
      const collectionPrefix = this.generateRandomString();
      const customersInSegment =
        await this.customersService.getSegmentCustomersFromQuery(
          createSegmentDTO.inclusionCriteria.query,
          account,
          session,
          true,
          0,
          collectionPrefix
        );

      if (!customersInSegment || customersInSegment.length === 0) {
        return { size: 0, total: 1 };
      }

      const mongoCollection = this.connection.db.collection(customersInSegment);

      const segmentDocuments = await mongoCollection.countDocuments();
      const totalCount = await this.customersService.customersSize(
        account,
        session
      );
      try {
        await this.deleteCollectionsWithPrefix(collectionPrefix);
      } catch (e) {
        this.error(e, this.size.name, session, account.id);
      }
      return { size: segmentDocuments, total: totalCount };
    } else if (createSegmentDTO.inclusionCriteria.query.type === 'all') {
      const collectionPrefix = this.generateRandomString();
      const customersInSegment =
        await this.customersService.getSegmentCustomersFromQuery(
          createSegmentDTO.inclusionCriteria.query,
          account,
          session,
          true,
          0,
          collectionPrefix
        );

      if (!customersInSegment || customersInSegment.length === 0) {
        return { size: 0, total: 1 };
      }

      const mongoCollection = this.connection.db.collection(customersInSegment);

      const segmentDocuments = await mongoCollection.countDocuments();
      const totalCount = await this.customersService.customersSize(
        account,
        session
      );
      try {
        await this.deleteCollectionsWithPrefix(collectionPrefix);
      } catch (e) {
        this.debug(
          `could not drop: ${collectionPrefix}`,
          this.size.name,
          session,
          account.id
        );
        this.error(e, this.size.name, session);
      }
      return { size: segmentDocuments, total: totalCount };
    } else {
      throw new Error(`Shouldn't be making it here`);
    }
  }

  public async update(
    account: Account,
    id: string,
    updateSegmentDTO: UpdateSegmentDTO,
    session: string
  ) {
    const segment = await this.findOne(account, id, session);
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    await this.segmentRepository.update(
      { id, workspace: { id: workspace.id } },
      { ...updateSegmentDTO, workspace: { id: workspace.id } }
    );

    (async () => {
      const forDelete = await this.segmentCustomersRepository.findBy({
        segment: id, //{ id: segment.id },
      });

      for (const { customerId } of forDelete) {
        const customer = await this.customersService.CustomerModel.findById(
          customerId
        ).exec();
        await this.updateAutomaticSegmentCustomerInclusion(
          account,
          customer,
          session
        );
        await this.customersService.recheckDynamicInclusion(
          account,
          customer,
          session
        );
      }

      const amount = await this.customersService.CustomerModel.count({
        workspaceId: workspace.id,
      });

      const batchOptions = {
        current: 0,
        documentsCount: amount || 0,
        batchSize: 500,
      };

      while (batchOptions.current < batchOptions.documentsCount) {
        const batch = await this.customersService.CustomerModel.find({
          workspaceId: workspace.id,
        })
          .skip(batchOptions.current)
          .limit(batchOptions.batchSize)
          .exec();

        for (const customer of batch) {
          await this.updateAutomaticSegmentCustomerInclusion(
            account,
            customer,
            session
          );
        }

        batchOptions.current += batchOptions.batchSize;
      }

      const records = await this.segmentCustomersRepository.findBy({
        segment: id, //{ id: segment.id },
      });

      for (const { customerId } of records) {
        const customer = await this.customersService.CustomerModel.findById(
          customerId
        ).exec();
        await this.customersService.recheckDynamicInclusion(
          account,
          customer,
          session
        );
      }
    })();
  }

  public async delete(account: Account, id: string, session: string) {
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    await this.segmentRepository.delete({
      id,
      workspace: { id: workspace.id },
    });
  }

  public async getCustomers(
    account: Account,
    id: string,
    take = 100,
    skip = 0,
    createdAtSortType: 'asc' | 'desc' = 'asc',
    session: string
  ) {
    const segment = await this.findOne(account, id, session);

    const totalPages = Math.ceil(
      (await this.segmentCustomersRepository.count({
        where: {
          segment: segment.id, //{ id: segment.id },
        },
      })) / take || 1
    );

    const records = await this.segmentCustomersRepository.find({
      where: {
        segment: segment.id, //{ id: segment.id },
      },
      take: take < 100 ? take : 100,
      skip,
    });

    const customers = await this.customersService.CustomerModel.find({
      _id: { $in: records.map((record) => record.customerId) },
    })
      .sort({ _id: createdAtSortType === 'asc' ? 1 : -1 })
      .exec();

    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    const pk = (
      await this.customersService.CustomerKeysModel.findOne({
        isPrimary: true,
        workspaceId: workspace.id,
      })
    )?.toObject();

    return {
      data: customers.map((customer) => ({
        ...(customer?.toObject() || {}),
        id: customer._id,
        createdAt: customer.createdAt,
        dataSource: 'segmentPeople',
      })),
      totalPages,
      pkName: pk?.key,
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
        if (segment.type && segment.type === 'manual') {
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
        this.debug(
          `we updated doInclude: ${doInclude}`,
          this.updateCustomerSegments.name,
          session,
          account.id
        );
        const isMemberOf = await this.isCustomerMemberOf(
          account,
          segment.id,
          customerId,
          queryRunner
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
    this.debug(
      `updated all segments with: ${customerId}`,
      this.updateCustomerSegments.name,
      session,
      account.id
    );
    return { added: addedToSegments, removed: removedFromSegments };
  }

  /**
   * Add customer to segment record if not already exists.
   */
  public async addCustomerToSegment(
    account: Account,
    segmentId: string,
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

    const foundRecord = await queryRunner.manager.findOneBy(SegmentCustomers, {
      segment: segmentId, //{ id: segment.id },
      customerId,
    });

    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    if (foundRecord)
      throw new ConflictException('Customer already in this segment');
    await queryRunner.manager.save(SegmentCustomers, {
      segment: segmentId, //{ id: segment.id },
      customerId,
      workspace,
    });
  }

  public async removeCustomerFromSegment(
    segmentId: string,
    customerId: string,
    queryRunner: QueryRunner
  ) {
    await queryRunner.manager.delete(SegmentCustomers, {
      segment: segmentId, //{ id: segmentId },
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
      segment: id, //{ id: segment.id },
      customerId,
    });

    if (foundRecord)
      throw new ConflictException('Customer already in this segment');

    await this.segmentCustomersRepository.save({
      segment: id, //{ id: segment.id },
      customerId,
      workspace,
    });
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    const transactionSession = await this.connection.startSession();
    transactionSession.startTransaction();
    try {
      const customer = await this.customersService.CustomerModel.findById(
        customerId
      ).exec();
      await this.workflowsService.enrollCustomer(
        account,
        customer,
        runner,
        transactionSession,
        session
      );
      await runner.commitTransaction();
      await transactionSession.commitTransaction();
    } catch (error) {
      this.logger.error(error);
      await transactionSession.abortTransaction();
      await runner.rollbackTransaction();
    } finally {
      await transactionSession.endSession();
      await runner.release();
    }
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
      segment: segmentId, // Assuming segment is identified by segmentId
    });

    const mongoCollection = this.connection.db.collection(collectionName);

    let processedCount = 0;
    const totalDocuments = await mongoCollection.countDocuments();

    while (processedCount < totalDocuments) {
      // Fetch a batch of documents from MongoDB
      const mongoDocuments = await mongoCollection
        .find({})
        .skip(processedCount)
        .limit(batchSize)
        .toArray();

      // Convert MongoDB documents to SegmentCustomers entities
      const segmentCustomersArray = mongoDocuments.map((doc) => ({
        segment: segmentId,
        customerId: doc._id.toString(), // Assuming _id is the ObjectId
        workspace,
      }));

      // Batch save to segmentCustomersRepository
      await queryRunner.manager
        .getRepository(SegmentCustomers)
        .save(segmentCustomersArray);

      // Update processed count
      processedCount += mongoDocuments.length;
    }

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
        segment: id, //{ id: segment.id },
        customerId,
        workspace,
      }))
    );
  }

  public async clearCustomers(account: Account, id: string, session: string) {
    const segment = await this.findOne(account, id, session);
    if (!segment) {
      throw new HttpException('No segment found.', HttpStatus.NOT_FOUND);
    }
    await this.segmentCustomersRepository.delete({
      segment: id, //{ id: segment.id },
    });
  }

  public async deleteBatchedCustomers(
    account: Account,
    id: string,
    customerIds: string[],
    session: string
  ) {
    await this.segmentCustomersRepository.delete({
      segment: id,
      customerId: In(customerIds),
    });

    for (const customerId of customerIds) {
      (async () => {
        const customer = await this.customersService.findById(
          account,
          customerId
        );
        await this.customersService.recheckDynamicInclusion(
          account,
          customer,
          session
        );
      })();
    }
  }

  public async deleteCustomer(
    account: Account,
    id: string,
    customerId: string,
    session: string
  ) {
    const segment = await this.findOne(account, id, session);

    await this.segmentCustomersRepository.delete({
      segment: id, //{ id: segment.id },
      customerId,
    });

    (async () => {
      const customer = await this.customersService.findById(
        account,
        customerId
      );
      await this.customersService.recheckDynamicInclusion(
        account,
        customer,
        session
      );
    })();
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
      workspace: { id: workspace.id },
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

    const { stats } = await this.customersService.loadCSV(
      account,
      csvFile,
      session
    );

    await this.assignCustomers(account, segment.id, stats.customers, session);
    return { stats };
  }

  public async updateAutomaticSegmentCustomerInclusion(
    account: Account,
    customer: CustomerDocument,
    session: string
  ) {
    await this.deleteCustomerFromAllAutomaticSegments(account, customer._id);
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    const segments = await this.segmentRepository.findBy({
      workspace: {
        id: workspace.id,
      },
      type: SegmentType.AUTOMATIC,
    });

    for (const segment of segments) {
      try {
        if (
          await this.audiencesHelper.checkInclusion(
            customer,
            segment.inclusionCriteria,
            session
          )
        )
          await this.assignCustomer(account, segment.id, customer._id, session);
      } catch (e) {
        this.logger.error(e);
      }
    }
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    const transactionSession = await this.connection.startSession();
    transactionSession.startTransaction();
    try {
      await this.workflowsService.enrollCustomer(
        account,
        customer,
        runner,
        transactionSession,
        session
      );
      await runner.commitTransaction();
      await transactionSession.commitTransaction();
    } catch (error) {
      this.logger.error(error);
      await transactionSession.abortTransaction();
      await runner.rollbackTransaction();
    } finally {
      await transactionSession.endSession();
      await runner.release();
    }
  }

  public async isCustomerMemberOf(
    account: Account,
    id: string,
    customerId: string,
    queryRunner?: QueryRunner
  ) {
    let record: SegmentCustomers;
    if (!queryRunner) {
      record = await this.segmentCustomersRepository.findOneBy({
        segment: id, //{ id, owner: { id: account.id } },
        customerId,
      });
    } else {
      try {
        record = await queryRunner.manager.findOne(SegmentCustomers, {
          where: {
            segment: id, // {id},//{ id, owner: { id: account.id } },
            customerId,
          },
        });
      } catch (e) {
        this.error(e, this.isCustomerMemberOf.name, 'dafd');
        throw e;
      }
    }

    return !!record;
  }
}
