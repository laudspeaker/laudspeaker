import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ModalEvent } from './entities/modal.entity';
import { ModalsController } from './modals.controller';
import { ModalsService } from './modals.service';

@Module({
  imports: [TypeOrmModule.forFeature([ModalEvent])],
  controllers: [ModalsController],
  providers: [ModalsService],
  exports: [ModalsService],
})
export class ModalsModule {}

