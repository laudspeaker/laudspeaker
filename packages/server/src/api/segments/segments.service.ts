import {  HttpException, HttpStatus, Injectable, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, Repository } from 'typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { CreateSegmentDTO } from './dto/create-segment.dto';
import { Segment } from './entities/segment.entity';

@Injectable()
export class SegmentsService {
  private readonly logger: LoggerService;

  constructor(
    @InjectRepository(Segment) private segmentsRepository: Repository<Segment>
  ) {}

  public async findAll(options : FindManyOptions<Segment>) {
    return this.segmentsRepository.find(options);
  }

  public async findOne(account: Account, id: string) {
    return this.segmentsRepository.findOneBy({ userId: account.id, id });
  }

  /**
   * Create new segment by passing name and inclusion criteria
   */
  public async createSegment(createSegmentDTO: CreateSegmentDTO,userId:string) {
    const newSegment =new Segment()
    newSegment.name = createSegmentDTO.name;
    newSegment.userId = userId;
    if (createSegmentDTO.inclusionCriteria) {
      newSegment.inclusionCriteria = createSegmentDTO.inclusionCriteria;
    }
    
    try {
      return await this.segmentsRepository.insert(
        newSegment
      )
    } catch (error) {
      this.logger.error(error);
      throw new HttpException("Error on segment creation.",HttpStatus.BAD_REQUEST);
    }
  }
}
