import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Between, Repository } from 'typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { CreateJobDto } from './dto/create-job.dto';
import { Job } from './entities/job.entity';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Workflow } from '../workflows/entities/workflow.entity';
import { Audience } from '../audiences/entities/audience.entity';

const MAX_DATE = new Date(8640000000000000);
const MIN_DATE = new Date(0);

@Injectable()
export class JobsService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(Job) private readonly jobsRepository: Repository<Job>
  ) {}

  async create(account: Account, createJobDto: CreateJobDto) {
    const job = new Job();
    job.customer = createJobDto.customer;
    job.endTime = createJobDto.endTime;
    job.startTime = createJobDto.startTime;
    job.executionTime = createJobDto.executionTime;
    job.workflow = createJobDto.workflow;
    job.from = createJobDto.from;
    job.to = createJobDto.to;
    job.owner = account.id;
    return this.jobsRepository.save({
      ...job,
    });
  }

  async findAll(account: Account): Promise<Job[]> {
    return await this.jobsRepository.find({
      where: { owner: account.id },
    });
  }

  async findAllByDate(date: Date): Promise<Job[]> {
    return await this.jobsRepository.find({
      where: [
        { executionTime: Between(MIN_DATE, date) },
        {
          startTime: Between(MIN_DATE, date),
          endTime: Between(date, MAX_DATE),
        },
      ],
    });
  }

  async findOneById(account: Account, id: string): Promise<Job> {
    return await this.jobsRepository.findOneBy({
      owner: account.id,
      id: id,
    });
  }

  // async update(account: Account, id: string, updateJobDto: UpdateJobDto) {
  //   return await this.jobsRepository.update(
  //     { owner: { id: (<Account>account).id }, id: id },
  //     { ...updateJobDto }
  //   );
  // }

  async remove(account: Account, id: string): Promise<void> {
    await this.jobsRepository.delete({
      owner: (<Account>account).id,
      id,
    });
  }
}
