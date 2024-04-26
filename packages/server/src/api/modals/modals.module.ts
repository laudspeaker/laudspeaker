import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from '../accounts/accounts.module';
import { CustomersModule } from '../customers/customers.module';
import { ModalEvent } from './entities/modal-event.entity';
import { ModalsController } from './modals.controller';
import { ModalsService } from './modals.service';
import { WorkspacesModule } from '../workspaces/workspaces.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([ModalEvent]),
    forwardRef(() => AccountsModule),
    forwardRef(() => CustomersModule),
    forwardRef(() => WorkspacesModule),
  ],
  controllers: [ModalsController],
  providers: [ModalsService],
  exports: [ModalsService],
})
export class ModalsModule {}
