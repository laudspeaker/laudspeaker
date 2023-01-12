import { Module } from '@nestjs/common';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workflow } from './entities/workflow.entity';
import { Audience } from '../audiences/entities/audience.entity';
import { AudiencesService } from '../audiences/audiences.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import { CustomersService } from '../customers/customers.service';
import { TemplatesService } from '../templates/templates.service';
import { Template } from '../templates/entities/template.entity';
import { SlackService } from '../slack/slack.service';
import { BullModule } from '@nestjs/bull';
import { Installation } from '../slack/entities/installation.entity';
import { State } from '../slack/entities/state.entity';
import { Account } from '../accounts/entities/accounts.entity';
import {
  CustomerKeys,
  CustomerKeysSchema,
} from '../customers/schemas/customer-keys.schema';
import {
  EventKeys,
  EventKeysSchema,
} from '../events/schemas/event-keys.schema';
import { Segment } from '../segments/entities/segment.entity';
import { AudiencesModule } from '../audiences/audiences.module';
import { CustomersModule } from '../customers/customers.module';
import { TemplatesModule } from '../templates/templates.module';
import { SlackModule } from '../slack/slack.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workflow,
      Account,
      Audience,
      Template,
      Installation,
      State,
      Segment,
    ]),
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
      { name: EventKeys.name, schema: EventKeysSchema },
    ]),
    MongooseModule.forFeature([
      { name: CustomerKeys.name, schema: CustomerKeysSchema },
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
      name: 'events',
    }),
    AudiencesModule,
    CustomersModule,
    TemplatesModule,
    SlackModule,
  ],
  controllers: [WorkflowsController],
  providers: [WorkflowsService],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
