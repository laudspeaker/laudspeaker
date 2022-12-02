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
    AuthModule,
  ],
  controllers: [EventsController],
  providers: [
    EventsService,
    CustomersService,
    AccountsService,
    TemplatesService,
    WorkflowsService,
    AudiencesService,
    SlackService,
  ],
  exports: [EventsService],
})
export class EventsModule {}
