import { Inject, Injectable, Logger } from '@nestjs/common';
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
    private readonly logger: Logger,
    @InjectRepository(Job) public readonly jobsRepository: Repository<Job>
  ) {}

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: JobsService.name,
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
        class: JobsService.name,
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
        class: JobsService.name,
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
        class: JobsService.name,
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
        class: JobsService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  async create(account: Account, createJobDto: CreateJobDto, session: string) {
    const {
      customer,
      endTime,
      startTime,
      executionTime,
      workflow,
      from,
      to,
      type,
    } = createJobDto;
    return this.jobsRepository.save({
      owner: { id: account.id },
      customer,
      endTime,
      startTime,
      executionTime,
      workflow: { id: workflow },
      from: { id: from },
      to: { id: to },
      type,
    });
  }

  async findAll(account: Account, session: string): Promise<Job[]> {
    return await this.jobsRepository.find({
      where: { owner: { id: account.id } },
    });
  }

  async findAllByDate(date: Date, session: string): Promise<Job[]> {
    return await this.jobsRepository.find({
      where: [
        { executionTime: Between(MIN_DATE, date) },
        {
          startTime: Between(MIN_DATE, date),
          endTime: Between(date, MAX_DATE),
        },
      ],
      relations: ['owner', 'from', 'to', 'workflow'],
    });
  }

  async findOneById(
    account: Account,
    id: string,
    session: string
  ): Promise<Job> {
    return await this.jobsRepository.findOneBy({
      owner: { id: account.id },
      id: id,
    });
  }

  async remove(account: Account, id: string, session: string): Promise<void> {
    await this.jobsRepository.delete({
      owner: { id: account.id },
      id,
    });
  }
}
