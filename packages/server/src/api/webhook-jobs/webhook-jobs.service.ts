import { Inject, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import {
  WebhookJob,
  WebhookJobStatus,
  WebhookProvider,
} from './entities/webhook-job.entity';
import { UpdateWebhookJobDto } from './dto/update-webhook-job.dto';
import { CreateWebhookJobDto } from './dto/create-webhook-job.dto';

@Injectable()
export class WebhookJobsService {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @InjectRepository(WebhookJob)
    public readonly webhookjobsRepository: Repository<WebhookJob>
  ) {}

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: WebhookJobsService.name,
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
        class: WebhookJobsService.name,
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
        class: WebhookJobsService.name,
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
        class: WebhookJobsService.name,
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
        class: WebhookJobsService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  async create(createWebhookJobDto: CreateWebhookJobDto) {
    const { provider } = createWebhookJobDto;
    return this.webhookjobsRepository.save({
      provider,
      status: WebhookJobStatus.PENDING,
    });
  }

  async findAll(): Promise<WebhookJob[]> {
    return await this.webhookjobsRepository.find();
  }

  async findAllByProvider(provider: WebhookProvider): Promise<WebhookJob[]> {
    return await this.webhookjobsRepository.find({
      where: [
        {
          provider: provider,
          status: WebhookJobStatus.PENDING,
        },
      ],
    });
  }

  async findOneById(id: string): Promise<WebhookJob> {
    return await this.webhookjobsRepository.findOneBy({
      id: id,
    });
  }

  async update(id: string, updateWebhookJobDto: UpdateWebhookJobDto) {
    return await this.webhookjobsRepository.update(
      { id: id },
      { ...updateWebhookJobDto }
    );
  }

  async remove(id: string): Promise<void> {
    await this.webhookjobsRepository.delete({
      id,
    });
  }
}
