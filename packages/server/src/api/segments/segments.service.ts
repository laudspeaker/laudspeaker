import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { CreateSegmentDTO } from './dto/create-segment.dto';
import { UpdateSegmentDTO } from './dto/update-segment.dto';
import { SegmentCustomers } from './entities/segment-customers.entity';
import { Segment } from './entities/segment.entity';

@Injectable()
export class SegmentsService {
  constructor(
    @InjectRepository(Segment) private segmentRepository: Repository<Segment>,
    @InjectRepository(SegmentCustomers)
    private segmentCustomersRepository: Repository<SegmentCustomers>
  ) {}

  public async findOne(account: Account, id: string) {
    const segment = await this.segmentRepository.findOneBy({
      id,
      user: { id: account.id },
    });

    if (!segment) throw new NotFoundException('Segment not found');

    return segment;
  }

  public async findAll(account: Account, take = 100, skip = 0) {
    const totalPages = Math.ceil(
      (await this.segmentRepository.count({
        where: {
          user: { id: account.id },
        },
      })) / take || 1
    );
    const segments = await this.segmentRepository.find({
      where: { user: { id: account.id } },
      take: take < 100 ? take : 100,
      skip,
    });

    return { data: segments, totalPages };
  }

  public async create(account: Account, createSegmentDTO: CreateSegmentDTO) {
    return this.segmentRepository.create({
      ...createSegmentDTO,
      user: { id: account.id },
    });
  }

  public async update(
    account: Account,
    id: string,
    updateSegmentDTO: UpdateSegmentDTO
  ) {
    await this.segmentRepository.update(
      { id, user: { id: account.id } },
      { ...updateSegmentDTO, user: { id: account.id } }
    );
  }

  public async delete(account: Account, id: string) {
    await this.segmentRepository.delete({ id, user: { id: account.id } });
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
      await this.assignCustomer(account, id, customerId);
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
}
