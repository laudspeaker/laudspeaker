import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from '../accounts/accounts.module';
import { Account } from '../accounts/entities/accounts.entity';
import { AuthModule } from '../auth/auth.module';
import { Recovery } from '../auth/entities/recovery.entity';
import { CustomersModule } from '../customers/customers.module';
import { SegmentCustomers } from '../segments/entities/segment-customers.entity';
import { Installation } from '../slack/entities/installation.entity';
import { Template } from '../templates/entities/template.entity';
import { TestsController } from './tests.controller';
import { TestsService } from './tests.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      Installation,
      Template,
      Recovery,
      SegmentCustomers,
    ]),
    CustomersModule,
    AuthModule,
    AccountsModule,
  ],
  controllers: [TestsController],
  providers: [TestsService],
  exports: [TestsService],
})
export class TestsModule {}
