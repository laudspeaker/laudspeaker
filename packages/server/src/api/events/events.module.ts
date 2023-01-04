import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bull';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { CustomersService } from '../customers/customers.service';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import { AccountsService } from '../accounts/accounts.service';
import { Account } from '../accounts/entities/accounts.entity';
import { WorkflowsService } from '../workflows/workflows.service';
import { Workflow } from '../workflows/entities/workflow.entity';
import { Template } from '../templates/entities/template.entity';
import { TemplatesService } from '../templates/templates.service';
import { AudiencesService } from '../audiences/audiences.service';
import { Audience } from '../audiences/entities/audience.entity';
import { Installation } from '../slack/entities/installation.entity';
import { SlackService } from '../slack/slack.service';
import { State } from '../slack/entities/state.entity';
import { Stats } from '../audiences/entities/stats.entity';
import {
  CustomerKeys,
  CustomerKeysSchema,
} from '../customers/schemas/customer-keys.schema';
import { AuthModule } from '../auth/auth.module';
import { Event, EventSchema } from './schemas/event.schema';
import { EventKeys, EventKeysSchema } from './schemas/event-keys.schema';
import { CustomersModule } from '../customers/customers.module';
import { AccountsModule } from '../accounts/accounts.module';
import { TemplatesModule } from '../templates/templates.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { AudiencesModule } from '../audiences/audiences.module';
import { SlackModule } from '../slack/slack.module';
import {
  PosthogEventType,
  PosthogEventTypeSchema,
} from './schemas/posthog-event-type.schema';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      State,
      Account,
      Workflow,
      Template,
      Audience,
      Installation,
      Stats,
    ]),
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
      { name: CustomerKeys.name, schema: CustomerKeysSchema },
      { name: Event.name, schema: EventSchema },
      { name: EventKeys.name, schema: EventKeysSchema },
      { name: PosthogEventType.name, schema: PosthogEventTypeSchema },
    ]),
    BullModule.registerQueue({
      name: 'email',
    }),
    BullModule.registerQueue({
      name: 'slack',
    }),
    BullModule.registerQueue({
      name: 'customers',
    }),
    BullModule.registerQueue({
      name: 'sms',
    }),
    AuthModule,
    CustomersModule,
    AccountsModule,
    TemplatesModule,
    WorkflowsModule,
    AudiencesModule,
    SlackModule,
  ],
  controllers: [EventsController],
  providers: [EventsService],
  exports: [EventsService],
})
export class EventsModule {}
