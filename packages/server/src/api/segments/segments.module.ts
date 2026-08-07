import { Module } from '@nestjs/common';
import { forwardRef } from '@nestjs/common/utils';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersModule } from '../customers/customers.module';
import { SegmentCustomers } from './entities/segment-customers.entity';
import { Segment } from './entities/segment.entity';
import { SegmentsController } from './segments.controller';
import { SegmentsService } from './segments.service';
import { SegmentUpdateProcessor } from './processors/segment.processor';
import { CustomerChangeProcessor } from '../customers/processors/customers.processor';
import { JourneysModule } from '../journeys/journeys.module';
import { AccountsModule } from '../accounts/accounts.module';
import { SegmentCustomersService } from './segment-customers.service';
import { Account } from '../accounts/entities/accounts.entity';
import { StepsModule } from '../steps/steps.module';
import { StepsHelper } from '../steps/steps.helper';
import { Customer } from '../customers/entities/customer.entity';
import { QueryService } from '../../common/services/query';

function getProvidersList() {
  let providerList: Array<any> = [
    SegmentsService,
    StepsHelper,
    SegmentCustomersService,
    QueryService,
  ];

  if (process.env.LAUDSPEAKER_PROCESS_TYPE == 'QUEUE') {
    providerList = [
      ...providerList,
      SegmentUpdateProcessor,
    ];
  }

  return providerList;
}

function getExportList() {
  let exportList: Array<any> = [SegmentsService, SegmentCustomersService];

  if (process.env.LAUDSPEAKER_PROCESS_TYPE == 'QUEUE') {
    exportList = [
      ...exportList,
      SegmentUpdateProcessor,
    ];
  }

  return exportList;
}

@Module({
  imports: [
    TypeOrmModule.forFeature([Segment, SegmentCustomers, Account, Customer]),
    forwardRef(() => CustomersModule),
    forwardRef(() => JourneysModule),
    forwardRef(() => StepsModule),
    forwardRef(() => AccountsModule),
  ],
  controllers: [SegmentsController],
  providers: getProvidersList(),
  exports: getExportList(),
})
export class SegmentsModule { }
