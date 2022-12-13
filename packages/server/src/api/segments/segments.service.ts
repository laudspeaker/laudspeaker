import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { Segment } from './entities/segment.entity';

@Injectable()
export class SegmentsService {
  constructor(
    @InjectRepository(Segment) private segmentsRepository: Repository<Segment>
  ) {}

  public async findAll(account: Account) {
    return this.segmentsRepository.findBy({ userId: account.id });
  }

  public async findOne(account: Account, id: string) {
    return this.segmentsRepository.findOneBy({ userId: account.id, id });
  }
}
