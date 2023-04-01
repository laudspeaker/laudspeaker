import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { WebhookJob, WebhookJobStatus, WebhookProvider } from './entities/webhook-job.entity';
import { UpdateWebhookJobDto } from './dto/update-webhook-job.dto';
import { CreateWebhookJobDto } from './dto/create-webhook-job.dto';

@Injectable()
export class WebhookJobsService {
    constructor(
        @Inject(WINSTON_MODULE_NEST_PROVIDER)
        private readonly logger: LoggerService,
        @InjectRepository(WebhookJob) public readonly webhookjobsRepository: Repository<WebhookJob>
    ) { }

    async create(createWebhookJobDto: CreateWebhookJobDto) {
        const { provider } = createWebhookJobDto;
        return this.webhookjobsRepository.save({
            provider,
            status: WebhookJobStatus.PENDING
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
                    status: WebhookJobStatus.PENDING
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
