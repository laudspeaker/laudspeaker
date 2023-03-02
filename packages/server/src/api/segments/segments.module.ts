import { Module } from '@nestjs/common';
import { forwardRef } from '@nestjs/common/utils';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AudiencesHelper } from '../audiences/audiences.helper';
import { CustomersModule } from '../customers/customers.module';
import { WorkflowsModule } from '../workflows/workflows.module';
import { SegmentCustomers } from './entities/segment-customers.entity';
import { Segment } from './entities/segment.entity';
import { SegmentsController } from './segments.controller';
import { SegmentsService } from './segments.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Segment, SegmentCustomers]),
    forwardRef(() => CustomersModule),
    forwardRef(() => WorkflowsModule),
  ],
  controllers: [SegmentsController],
  providers: [SegmentsService, AudiencesHelper],
  exports: [SegmentsService],
})
export class SegmentsModule {}
