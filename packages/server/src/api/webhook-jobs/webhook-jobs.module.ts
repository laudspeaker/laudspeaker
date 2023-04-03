import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookJob } from './entities/webhook-job.entity';
import { WebhookJobsService } from './webhook-jobs.service';

@Module({
  imports: [TypeOrmModule.forFeature([WebhookJob])],
  providers: [WebhookJobsService],
  controllers: [],
  exports: [WebhookJobsService],
})
export class WebhookJobsModule {}
