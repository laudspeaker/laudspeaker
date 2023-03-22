import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Injectable,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { isUUID } from 'class-validator';
import { FindManyOptions, Repository } from 'typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { CreateFilterDTO } from './dto/create-filter.dto';
import { UpdateFilterDTO } from './dto/update-filter.dto';
import { Filter } from './entities/filter.entity';

@Injectable()
export class FilterService {
  private readonly logger: LoggerService;

  constructor(
    @InjectRepository(Filter) private filterRepository: Repository<Filter>
  ) {}

  public async findAll(options: FindManyOptions<Filter>) {
    return this.filterRepository.find(options);
  }

  public async findOne(account: Account, id: string) {
    if (!isUUID(id)) throw new BadRequestException('Invalid id');
    const filter = await this.filterRepository.findOneBy({
      user: { id: account.id },
      id,
    });
    if (!filter) throw new NotFoundException('Filter not found');

    return filter;
  }

  /**
   * Create new segment by passing name and inclusion criteria
   */
  public async createFilter(createFilterDTO: CreateFilterDTO, userId: string) {
    const { inclusionCriteria, resources } = createFilterDTO;

    try {
      return await this.filterRepository.save({
        inclusionCriteria,
        resources,
        user: { id: userId },
      });
    } catch (error) {
      this.logger.error(error);
      throw new HttpException(
        'Error on filter creation.',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  public async updateFilter(
    account: Account,
    id: string,
    updateFilterDTO: UpdateFilterDTO
  ) {
    const filter = await this.findOne(account, id);
    await this.filterRepository.save({ ...filter, ...updateFilterDTO });
  }
}
