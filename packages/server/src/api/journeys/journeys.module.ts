import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
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
import { SegmentsModule } from '../segments/segments.module';
import { JourneysController } from './journeys.controller';
import { JourneysService } from './journeys.service';
import { Journey } from './entities/journey.entity';
import { StepsModule } from '../steps/steps.module';
import { JourneyLocation } from './entities/journey-location.entity';
import { JourneyLocationsService } from './journey-locations.service';
import { JourneyChange } from './entities/journey-change.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      Installation,
      Filter,
      State,
      Template,
      Journey,
      JourneyLocation,
      JourneyChange,
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
      name: 'transition',
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
    forwardRef(() => StepsModule),
    forwardRef(() => SegmentsModule),
    forwardRef(() => TemplatesModule),
    SlackModule,
  ],
  controllers: [JourneysController],
  providers: [JourneysService, JourneyLocationsService],
  exports: [JourneysService],
})
export class JourneysModule {}
