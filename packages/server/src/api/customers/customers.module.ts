import { forwardRef, Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { CustomersService } from './customers.service';
import { Customer } from './entities/customer.entity';
import { AccountsModule } from '../accounts/accounts.module';
import { SegmentsModule } from '../segments/segments.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { EventsModule } from '../events/events.module';
import { StepsModule } from '../steps/steps.module';
import { JourneysModule } from '../journeys/journeys.module';
import { S3Service } from '../s3/s3.service';
import { Imports } from './entities/imports.entity';
import { ImportProcessor } from './imports.processor';
import { JourneyLocationsService } from '../journeys/journey-locations.service';
import { JourneyLocation } from '../journeys/entities/journey-location.entity';
import { SegmentsService } from '../segments/segments.service';
import { Segment } from '../segments/entities/segment.entity';
import { SegmentCustomers } from '../segments/entities/segment-customers.entity';
import { CustomerChangeProcessor } from './processors/customers.processor';
import { CacheService } from '../../common/services/cache.service';
import { CustomerKeysService } from './customer-keys.service';
import { CustomerKey } from './entities/customer-keys.entity';
import { AttributeType } from './entities/attribute-type.entity';
import { AttributeParameter } from './entities/attribute-parameter.entity';

function getProvidersList() {
  let providerList: Array<any> = [
    CustomersService,
    CustomerKeysService,
    S3Service,
    JourneyLocationsService,
    CacheService,
  ];

  if (process.env.LAUDSPEAKER_PROCESS_TYPE == 'QUEUE') {
    providerList = [
      ...providerList,
      ImportProcessor,
      CustomerChangeProcessor,
    ];
  }

  return providerList;
}

function getExportsList() {
  let exportList: Array<any> = [CustomersService, CustomerKeysService];

  if (process.env.LAUDSPEAKER_PROCESS_TYPE == 'QUEUE') {
    exportList = [
      ...exportList,
      CustomerChangeProcessor,
    ];
  }

  return exportList;
}

@Module({
  imports: [
    forwardRef(() => AccountsModule),
    forwardRef(() => SegmentsModule),
    forwardRef(() => StepsModule),
    forwardRef(() => JourneysModule),
    forwardRef(() => EventsModule),
    TypeOrmModule.forFeature([
      Account,
      Customer,
      CustomerKey,
      Imports,
      JourneyLocation,
      Segment,
      SegmentCustomers,
      AttributeType,
      AttributeParameter
    ]),
  ],
  controllers: [CustomersController],
  providers: getProvidersList(),
  exports: getExportsList(),
})
export class CustomersModule { }
