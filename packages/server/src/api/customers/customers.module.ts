import { Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { CustomersProcessor } from './customers.processor';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';
import { Customer, CustomerSchema } from './schemas/customer.schema';
import {
  CustomerKeys,
  CustomerKeysSchema,
} from './schemas/customer-keys.schema';
import { AccountsModule } from '../accounts/accounts.module';
import { SegmentsModule } from '../segments/segments.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { AudiencesHelper } from '../audiences/audiences.helper';
import { AudiencesModule } from '../audiences/audiences.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { EventsModule } from '../events/events.module';
import { StepsModule } from '../steps/steps.module';
import { CustomersConsumerService } from './customers.consumer';
import { KafkaModule } from '../kafka/kafka.module';
import { JourneysModule } from '../journeys/journeys.module';
import { S3Service } from '../s3/s3.service';
import { Imports } from './entities/imports.entity';
import { ImportProcessor } from './imports.porcessor';
import { JourneyLocationsService } from '../journeys/journey-locations.service';
import { JourneyLocation } from '../journeys/entities/journey-location.entity';
import { SegmentsService } from '../segments/segments.service';
import { Segment } from '../segments/entities/segment.entity';
import { SegmentCustomers } from '../segments/entities/segment-customers.entity';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
    ]),
    MongooseModule.forFeature([
      { name: CustomerKeys.name, schema: CustomerKeysSchema },
    ]),
    BullModule.registerQueue({
      name: 'customers',
    }),
    BullModule.registerQueue({
      name: 'imports',
    }),
    BullModule.registerQueue({
      name: 'events_pre',
    }),
    AccountsModule,
    SegmentsModule,
    AudiencesModule,
    WorkflowsModule,
    EventsModule,
    StepsModule,
    TypeOrmModule.forFeature([
      Account,
      Imports,
      JourneyLocation,
      Segment,
      SegmentCustomers,
    ]),
    KafkaModule,
    JourneysModule,
  ],
  controllers: [CustomersController],
  providers: [
    CustomersService,
    CustomersProcessor,
    AudiencesHelper,
    CustomersConsumerService,
    S3Service,
    ImportProcessor,
    JourneyLocationsService,
  ],

  exports: [CustomersService, CustomersConsumerService],
})
export class CustomersModule {}
