import { forwardRef, Module } from '@nestjs/common';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workflow } from './entities/workflow.entity';
import { Audience } from '../audiences/entities/audience.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import { Template } from '../templates/entities/template.entity';
import { BullModule } from '@nestjs/bullmq';
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
import { AudiencesModule } from '../audiences/audiences.module';
import { CustomersModule } from '../customers/customers.module';
import { TemplatesModule } from '../templates/templates.module';
import { SlackModule } from '../slack/slack.module';
import { Filter } from '../filter/entities/filter.entity';
import { AudiencesHelper } from '../audiences/audiences.helper';
import { SegmentsModule } from '../segments/segments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      Audience,
      Installation,
      Filter,
      State,
      Template,
      Workflow,
    ]),
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
      { name: EventKeys.name, schema: EventKeysSchema },
    ]),
    MongooseModule.forFeature([
      { name: CustomerKeys.name, schema: CustomerKeysSchema },
    ]),
    BullModule.registerQueue({
      name: 'message',
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
    forwardRef(() => CustomersModule),
    forwardRef(() => SegmentsModule),
    TemplatesModule,
    SlackModule,
  ],
  controllers: [WorkflowsController],
  providers: [WorkflowsService, AudiencesHelper],
  exports: [WorkflowsService],
})
export class WorkflowsModule {}
