import { Module, forwardRef } from '@nestjs/common';
import { StepsService } from './steps.service';
import { StepsController } from './steps.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BullModule } from '@nestjs/bullmq';
import { Step } from './entities/step.entity';
import { JobsService } from '../jobs/jobs.service';
import { Template } from '../templates/entities/template.entity';
import { Job } from '../jobs/entities/job.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import {
  CustomerKeys,
  CustomerKeysSchema,
} from '../customers/schemas/customer-keys.schema';
import { Audience } from '../audiences/entities/audience.entity';
import { SlackModule } from '../slack/slack.module';
import { CustomersModule } from '../customers/customers.module';
import { TemplatesModule } from '../templates/templates.module';
import { Account } from '../accounts/entities/accounts.entity';
import { AccountsModule } from '../accounts/accounts.module';
import { EventsModule } from '../events/events.module';
import { TransitionProcessor } from './processors/transition.processor';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { ModalsModule } from '../modals/modals.module';
import { WebsocketsModule } from '@/websockets/websockets.module';
import { RedlockModule } from '../redlock/redlock.module';
import { RedlockService } from '../redlock/redlock.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Step, Template, Job, Audience, Account]),
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
    ]),
    MongooseModule.forFeature([
      { name: CustomerKeys.name, schema: CustomerKeysSchema },
    ]),
    BullModule.registerQueue({
      name: 'transition',
    }),
    BullModule.registerQueue({
      name: 'webhooks',
    }),
    forwardRef(() => CustomersModule),
    forwardRef(() => WebhooksModule),
    forwardRef(() => TemplatesModule),
    forwardRef(() => AccountsModule),
    forwardRef(() => EventsModule),
    forwardRef(() => ModalsModule),
    forwardRef(() => WebsocketsModule),
    forwardRef(() => RedlockModule),
    SlackModule,
  ],
  providers: [StepsService, JobsService, TransitionProcessor, RedlockService],
  controllers: [StepsController],
  exports: [StepsService],
})
export class StepsModule {}
