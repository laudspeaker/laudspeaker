import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SendgridEvent } from './entities/sendgrid-event.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SendgridEvent])],
  providers: [WebhooksService],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
