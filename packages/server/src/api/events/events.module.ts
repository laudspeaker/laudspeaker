import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import { Account } from '../accounts/entities/accounts.entity';
import { Workflow } from '../workflows/entities/workflow.entity';
import { Template } from '../templates/entities/template.entity';
import { Audience } from '../audiences/entities/audience.entity';
import { Installation } from '../slack/entities/installation.entity';
import { State } from '../slack/entities/state.entity';
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
import { EventsProcessor } from './events.processor';
import {
  PosthogEvent,
  PosthogEventSchema,
} from './schemas/posthog-event.schema';
import { JourneysModule } from '../journeys/journeys.module';
import { AudiencesHelper } from '../audiences/audiences.helper';
import { SegmentsModule } from '../segments/segments.module';
import { EventsPreProcessor } from './events.preprocessor';
import { WebsocketsModule } from '@/websockets/websockets.module';
import { RedlockModule } from '../redlock/redlock.module';
import { RedlockService } from '../redlock/redlock.service';
import { JourneyLocationsService } from '../journeys/journey-locations.service';
import { JourneyLocation } from '../journeys/entities/journey-location.entity';
import { CustomersService } from '../customers/customers.service';
import { Imports } from '../customers/entities/imports.entity';
import { StepsModule } from '../steps/steps.module';
import { S3Service } from '../s3/s3.service';
import { Step } from '../steps/entities/step.entity';
import { Journey } from '../journeys/entities/journey.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      Audience,
      Installation,
      State,
      Template,
      Workflow,
      JourneyLocation,
      Imports,
      Step,
      Journey,
    ]),
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
      { name: CustomerKeys.name, schema: CustomerKeysSchema },
      { name: Event.name, schema: EventSchema },
      { name: PosthogEvent.name, schema: PosthogEventSchema },
      { name: EventKeys.name, schema: EventKeysSchema },
      { name: PosthogEventType.name, schema: PosthogEventTypeSchema },
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
    BullModule.registerQueue({
      name: 'events_pre',
    }),
    BullModule.registerQueue({
      name: 'webhooks',
    }),
    BullModule.registerQueue({
      name: 'transition',
    }),
    BullModule.registerQueue({
      name: 'imports',
    }),
    forwardRef(() => AuthModule),
    forwardRef(() => CustomersModule),
    forwardRef(() => AccountsModule),
    forwardRef(() => TemplatesModule),
    forwardRef(() => WorkflowsModule),
    forwardRef(() => JourneysModule),
    forwardRef(() => SegmentsModule),
    forwardRef(() => WebsocketsModule),
    AudiencesModule,
    SlackModule,
    forwardRef(() => RedlockModule),
    forwardRef(() => StepsModule),
  ],
  controllers: [EventsController],
  providers: [
    EventsService,
    EventsProcessor,
    EventsPreProcessor,
    AudiencesHelper,
    RedlockService,
    JourneyLocationsService,
    CustomersService,
    S3Service,
  ],
  exports: [EventsService],
})
export class EventsModule {}
