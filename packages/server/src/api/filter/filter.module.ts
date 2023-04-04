import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Filter } from './entities/filter.entity';
import { FilterController } from './filter.controller';
import { FilterService } from './filter.service';

@Module({
  imports: [TypeOrmModule.forFeature([Filter])],
  controllers: [FilterController],
  providers: [FilterService],
})
export class FilterModule {}
