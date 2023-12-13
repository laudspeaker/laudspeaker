import {
  ConflictException,
  forwardRef,
  Inject,
  Injectable,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';
import { BadRequestException } from '@nestjs/common/exceptions';
import { InjectRepository } from '@nestjs/typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DataSource, In, Like, Repository } from 'typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { AudiencesHelper } from '../audiences/audiences.helper';
import { CustomersService } from '../customers/customers.service';
import { CustomerDocument } from '../customers/schemas/customer.schema';
import { Filter } from '../filter/entities/filter.entity';
import { WorkflowsService } from '../workflows/workflows.service';
import { CreateSegmentDTO } from './dto/create-segment.dto';
import { UpdateSegmentDTO } from './dto/update-segment.dto';
import { SegmentCustomers } from './entities/segment-customers.entity';
import { Segment, SegmentType } from './entities/segment.entity';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose from 'mongoose';

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

  public async findOne(account: Account, id: string, session: string) {
    const segment = await this.segmentRepository.findOneBy({
      id,
      owner: { id: account.id },
    });

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
    const totalPages = Math.ceil(
      (await this.segmentRepository.count({
        where: {
          owner: { id: account.id },
        },
      })) / take || 1
    );
    const segments = await this.segmentRepository.find({
      where: { name: Like(`%${search}%`), owner: { id: account.id } },
      take: take < 100 ? take : 100,
      skip,
    });

    return { data: segments, totalPages };
  }

  public async create(
    account: Account,
    createSegmentDTO: CreateSegmentDTO,
    session: string
  ) {
    const segment = await this.segmentRepository.save({
      ...createSegmentDTO,
      owner: { id: account.id },
    });

    if (segment.type === SegmentType.AUTOMATIC) {
      this.customersService.CustomerModel.find({
        ownerId: account.id,
      })
        .exec()
        .then((customers) => {
          for (const customer of customers) {
            this.updateAutomaticSegmentCustomerInclusion(
              account,
              customer,
              session
            );
          }
        });
    }

    // test code
    // this.customersService.createSegmentQuery(createSegmentDTO.inclusionCriteria.query);
    this.customersService.testCustomerInSegment(createSegmentDTO.inclusionCriteria.query);

    return segment;
  }

  public async update(
    account: Account,
    id: string,
    updateSegmentDTO: UpdateSegmentDTO,
    session: string
  ) {
    const segment = await this.findOne(account, id, session);

    await this.segmentRepository.update(
      { id, owner: { id: account.id } },
      { ...updateSegmentDTO, owner: { id: account.id } }
    );

    (async () => {
      const forDelete = await this.segmentCustomersRepository.findBy({
        segment: { id: segment.id },
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
        ownerId: account.id,
      });

      const batchOptions = {
        current: 0,
        documentsCount: amount || 0,
        batchSize: 500,
      };

      while (batchOptions.current < batchOptions.documentsCount) {
        const batch = await this.customersService.CustomerModel.find({
          ownerId: account.id,
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
        segment: { id: segment.id },
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
    await this.segmentRepository.delete({ id, owner: { id: account.id } });
  }

  public async getCustomers(
    account: Account,
    id: string,
    take = 100,
    skip = 0,
    session: string
  ) {
    const segment = await this.findOne(account, id, session);

    const totalPages = Math.ceil(
      (await this.segmentCustomersRepository.count({
        where: {
          segment: { id: segment.id },
        },
      })) / take || 1
    );

    const records = await this.segmentCustomersRepository.find({
      where: {
        segment: { id: segment.id },
      },
      take: take < 100 ? take : 100,
      skip,
    });

    const customers = await Promise.all(
      records.map((record) =>
        this.customersService.CustomerModel.findById(record.customerId).exec()
      )
    );

    return {
      data: customers.map((customer) => ({
        ...(customer?.toObject() || {}),
        id: customer.id,
        dataSource: 'segmentPeople',
      })),
      totalPages,
    };
  }

  public async assignCustomer(
    account: Account,
    id: string,
    customerId: string,
    session: string
  ) {
    const segment = await this.findOne(account, id, session);

    const foundRecord = await this.segmentCustomersRepository.findOneBy({
      segment: { id: segment.id },
      customerId,
    });

    if (foundRecord)
      throw new ConflictException('Customer already in this segment');

    await this.segmentCustomersRepository.save({
      segment: { id: segment.id },
      customerId,
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

  public async putCustomers(
    account: Account,
    id: string,
    customerIds: string[],
    session: string
  ) {
    const segment = await this.findOne(account, id, session);
    await this.clearCustomers(account, id, session);

    return this.segmentCustomersRepository.save(
      customerIds.map((customerId) => ({
        segment: { id: segment.id },
        customerId,
      }))
    );
  }

  public async clearCustomers(account: Account, id: string, session: string) {
    const segment = await this.findOne(account, id, session);
    await this.segmentCustomersRepository.delete({
      segment: { id: segment.id },
    });
  }

  public async deleteCustomer(
    account: Account,
    id: string,
    customerId: string,
    session: string
  ) {
    const segment = await this.findOne(account, id, session);

    await this.segmentCustomersRepository.delete({
      segment: { id: segment.id },
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
  }

  public async duplicate(account: Account, id: string, session: string) {
    const { name, description, type, inclusionCriteria, resources } =
      await this.findOne(account, id, session);

    return this.segmentRepository.save({
      name,
      description,
      type,
      inclusionCriteria,
      resources,
      owner: { id: account.id },
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
    await this.deleteCustomerFromAllAutomaticSegments(account, customer.id);

    const segments = await this.segmentRepository.findBy({
      owner: { id: account.id },
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
          await this.assignCustomer(account, segment.id, customer.id, session);
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
    customerId: string
  ) {
    const record = await this.segmentCustomersRepository.findOneBy({
      segment: { id, owner: { id: account.id } },
      customerId,
    });

    return !!record;
  }

  public async checkUsedInWorkflows(
    account: Account,
    id: string,
    session: string
  ) {
    const segment = await this.findOne(account, id, session);

    let names: string[] = [];

    await this.dataSource.transaction(async (transactionManager) => {
      const filters = await transactionManager.find(Filter, {
        select: ['inclusionCriteria', 'id'],
        where: { user: { id: account.id } },
      });

      const filterIds = filters
        .filter((filter) =>
          filter?.inclusionCriteria?.conditions?.some(
            (condition) => condition?.value === segment.id
          )
        )
        .map((filter) => filter.id);

      names = (
        await this.workflowsService.workflowsRepository.find({
          select: ['name'],
          where: {
            filter: { id: In(filterIds) },
            owner: { id: account.id },
            isDeleted: false,
            isStopped: false,
          },
        })
      ).map((workflow) => workflow.name);
    });

    return names;
  }
}
