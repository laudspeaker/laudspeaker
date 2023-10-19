import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Journey } from '../journeys/entities/journey.entity';
import { Step } from '../steps/entities/step.entity';
import { Template } from '../templates/entities/template.entity';
import { DevModeService } from './dev-mode.service';
import { DevMode } from './entities/dev-mode.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Journey, DevMode, Step, Template])],
  controllers: [],
  providers: [DevModeService],
  exports: [DevModeService],
})
export class DevModeModule {}

