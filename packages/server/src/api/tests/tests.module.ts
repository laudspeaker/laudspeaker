import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from '../accounts/accounts.module';
import { AccountsService } from '../accounts/accounts.service';
import { Account } from '../accounts/entities/accounts.entity';
import { Audience } from '../audiences/entities/audience.entity';
import { AuthHelper } from '../auth/auth.helper';
import { AuthModule } from '../auth/auth.module';
import { AuthService } from '../auth/auth.service';
import { CustomersModule } from '../customers/customers.module';
import { CustomersService } from '../customers/customers.service';
import {
  CustomerKeys,
  CustomerKeysSchema,
} from '../customers/schemas/customer-keys.schema';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import { EventsModule } from '../events/events.module';
import { Installation } from '../slack/entities/installation.entity';
import { Template } from '../templates/entities/template.entity';
import { Workflow } from '../workflows/entities/workflow.entity';
import { TestsController } from './tests.controller';
import { TestsService } from './tests.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      Audience,
      Workflow,
      Template,
      Installation,
    ]),
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
    ]),
    MongooseModule.forFeature([
      { name: CustomerKeys.name, schema: CustomerKeysSchema },
    ]),
    BullModule.registerQueue({
      name: 'customers',
    }),
    CustomersModule,
    AuthModule,
    AccountsModule,
  ],
  controllers: [TestsController],
  providers: [TestsService],
})
export class TestsModule {}
