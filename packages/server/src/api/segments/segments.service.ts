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
import { checkInclusion } from '../audiences/audiences.helper';
import { CustomersService } from '../customers/customers.service';
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
    private workflowsService: WorkflowsService
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
    return this.segmentRepository.create({
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

    const customers = this.segmentCustomersRepository.find({
      where: {
        segment: { id: segment.id },
      },
      take: take < 100 ? take : 100,
      skip,
    });

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

  public async deleteCustomerFromAllSegments(
    account: Account,
    customerId: string
  ) {
    const records = await this.segmentCustomersRepository.find({
      where: {
        segment: { owner: { id: account.id } },
        customerId,
      },
      relations: ['segment'],
    });

    await Promise.all(records.map((record) => record.remove()));
  }

  public async duplicate(account: Account, id: string) {
    const { name, description, type, inclusionCriteria, resources, owner } =
      await this.findOne(account, id);

    return this.segmentRepository.save({
      name,
      description,
      type,
      inclusionCriteria,
      resources,
      owner,
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

    const {
      stats: { customers },
    } = await this.customersService.loadCSV(account, csvFile);

    await this.assignCustomers(account, segment.id, customers);
  }

  public async updateAutomaticSegmentCustomerInclusion(
    account: Account,
    customerId: string
  ) {
    await this.deleteCustomerFromAllSegments(account, customerId);

    const customer = await this.customersService.CustomerModel.findById(
      customerId
    ).exec();

    const segments = await this.segmentRepository.findBy({
      owner: { id: account.id },
      type: SegmentType.AUTOMATIC,
    });

    for (const segment of segments) {
      try {
        if (checkInclusion(customer, segment.inclusionCriteria))
          await this.assignCustomer(account, segment.id, customerId);
      } catch (e) {
        this.logger.error(e);
      }
    }
    await this.workflowsService.enrollCustomer(account, customer);
  }
}
