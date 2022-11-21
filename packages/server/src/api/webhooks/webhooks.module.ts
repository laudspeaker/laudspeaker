import { Module } from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SendgridEvent } from './entities/sendgrid-event.entity';
import { Account } from '../accounts/entities/accounts.entity';
import { Audience } from '../audiences/entities/audience.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SendgridEvent, Account, Audience])],
  providers: [WebhooksService],
  controllers: [WebhooksController],
})
export class WebhooksModule {}
