import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from '../accounts/accounts.module';
import { ModalEvent } from './entities/modal-event.entity';
import { ModalsController } from './modals.controller';
import { ModalsService } from './modals.service';

@Module({
  imports: [TypeOrmModule.forFeature([ModalEvent]), AccountsModule],
  controllers: [ModalsController],
  providers: [ModalsService],
  exports: [ModalsService],
})
export class ModalsModule {}
