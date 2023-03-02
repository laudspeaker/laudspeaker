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
import { Repository } from 'typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { AudiencesHelper } from '../audiences/audiences.helper';
import { CustomersService } from '../customers/customers.service';
import { CustomerDocument } from '../customers/schemas/customer.schema';
import { WorkflowsService } from '../workflows/workflows.service';
import { CreateSegmentDTO } from './dto/create-segment.dto';
import { UpdateSegmentDTO } from './dto/update-segment.dto';
import { SegmentCustomers } from './entities/segment-customers.entity';
import { Segment, SegmentType } from './entities/segment.entity';

@Injectable()
export class SegmentsService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(Segment) private segmentRepository: Repository<Segment>,
    @InjectRepository(SegmentCustomers)
    private segmentCustomersRepository: Repository<SegmentCustomers>,
    @Inject(forwardRef(() => CustomersService))
    private customersService: CustomersService,
    private workflowsService: WorkflowsService,
    private readonly audiencesHelper: AudiencesHelper
  ) {}

  public async findOne(account: Account, id: string) {
    const segment = await this.segmentRepository.findOneBy({
      id,
      owner: { id: account.id },
    });

    if (!segment) throw new NotFoundException('Segment not found');

    return segment;
  }

  public async findAll(account: Account, take = 100, skip = 0) {
    const totalPages = Math.ceil(
      (await this.segmentRepository.count({
        where: {
          owner: { id: account.id },
        },
      })) / take || 1
    );
    const segments = await this.segmentRepository.find({
      where: { owner: { id: account.id } },
      take: take < 100 ? take : 100,
      skip,
    });

    return { data: segments, totalPages };
  }

  public async create(account: Account, createSegmentDTO: CreateSegmentDTO) {
    return this.segmentRepository.save({
      ...createSegmentDTO,
      owner: { id: account.id },
    });
  }

  public async update(
    account: Account,
    id: string,
    updateSegmentDTO: UpdateSegmentDTO
  ) {
    await this.segmentRepository.update(
      { id, owner: { id: account.id } },
      { ...updateSegmentDTO, owner: { id: account.id } }
    );
  }

  public async delete(account: Account, id: string) {
    await this.segmentRepository.delete({ id, owner: { id: account.id } });
  }

  public async getCustomers(
    account: Account,
    id: string,
    take = 100,
    skip = 0
  ) {
    const segment = await this.findOne(account, id);

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

    return { data: customers, totalPages };
  }

  public async assignCustomer(
    account: Account,
    id: string,
    customerId: string
  ) {
    const segment = await this.findOne(account, id);

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
  }

  public async assignCustomers(
    account: Account,
    id: string,
    customerIds: string[]
  ) {
    for (const customerId of customerIds) {
      try {
        await this.assignCustomer(account, id, customerId);
      } catch (e) {
        this.logger.error(e);
      }
    }
  }

  public async putCustomers(
    account: Account,
    id: string,
    customerIds: string[]
  ) {
    const segment = await this.findOne(account, id);
    await this.clearCustomers(account, id);

    return this.segmentCustomersRepository.save(
      customerIds.map((customerId) => ({
        segment: { id: segment.id },
        customerId,
      }))
    );
  }

  public async clearCustomers(account: Account, id: string) {
    const segment = await this.findOne(account, id);
    await this.segmentCustomersRepository.delete({
      segment: { id: segment.id },
    });
  }

  public async deleteCustomer(
    account: Account,
    id: string,
    customerId: string
  ) {
    const segment = await this.findOne(account, id);

    await this.segmentCustomersRepository.delete({
      segment: { id: segment.id },
      customerId,
    });
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

  public async duplicate(account: Account, id: string) {
    const { name, description, type, inclusionCriteria, resources } =
      await this.findOne(account, id);

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
    csvFile: Express.Multer.File
  ) {
    const segment = await this.findOne(account, id);

    if (segment.type !== SegmentType.MANUAL)
      throw new BadRequestException("This segment isn't manual");

    const { stats } = await this.customersService.loadCSV(account, csvFile);

    await this.assignCustomers(account, segment.id, stats.customers);
    return { stats };
  }

  public async updateAutomaticSegmentCustomerInclusion(
    account: Account,
    customer: CustomerDocument
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
            segment.inclusionCriteria
          )
        )
          await this.assignCustomer(account, segment.id, customer.id);
      } catch (e) {
        this.logger.error(e);
      }
    }
    await this.workflowsService.enrollCustomer(account, customer);
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
}
