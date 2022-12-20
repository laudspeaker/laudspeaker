import {
  HttpException,
  HttpStatus,
  Injectable,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';
import { BadRequestException } from '@nestjs/common/exceptions';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { FindManyOptions, Repository } from 'typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { CreateSegmentDTO } from './dto/create-segment.dto';
import { UpdateSegmentDTO } from './dto/update-segment.dto';
import { Segment } from './entities/segment.entity';

@Injectable()
export class SegmentsService {
  private readonly logger: LoggerService;

  constructor(
    @InjectRepository(Segment) private segmentsRepository: Repository<Segment>
  ) {}

  public async findAll(options: FindManyOptions<Segment>) {
    return this.segmentsRepository.find(options);
  }

  public async findOne(account: Account, id: string) {
    if (!isUUID(id)) throw new BadRequestException('Invalid id');
    const segment = await this.segmentsRepository.findOneBy({
      userId: account.id,
      id,
    });
    if (!segment) throw new NotFoundException('Segment not found');

    return segment;
  }

  /**
   * Create new segment by passing name and inclusion criteria
   */
  public async createSegment(
    createSegmentDTO: CreateSegmentDTO,
    userId: string
  ) {
    const newSegment = new Segment();
    newSegment.name = createSegmentDTO.name;
    newSegment.userId = userId;
    if (createSegmentDTO.inclusionCriteria) {
      newSegment.inclusionCriteria = createSegmentDTO.inclusionCriteria;
    }
    newSegment.resources = createSegmentDTO.resources;

    try {
      return await this.segmentsRepository.save(newSegment);
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        'Error on segment creation.',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  public async updateSegment(
    account: Account,
    id: string,
    updateSegmentDTO: UpdateSegmentDTO
  ) {
    const segment = await this.findOne(account, id);
    await this.segmentsRepository.save({ ...segment, ...updateSegmentDTO });
  }

  public async duplicateSegment(account: Account, id: string) {
    const segment = await this.findOne(account, id);
    const { inclusionCriteria, name, resources } = segment;
    const newSegment = await this.createSegment(
      { name: name + '-copy', inclusionCriteria, resources },
      account.id
    );
    return newSegment;
  }
}
