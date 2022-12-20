import { forwardRef, Module } from '@nestjs/common';
import { CustomersController } from './customers.controller';
import { Account } from '../accounts/entities/accounts.entity';
import { CustomersService } from './customers.service';
//import { EventsService } from "../events/events.service";
import { CustomersProcessor } from './customers.processor';
import { BullModule } from '@nestjs/bull';
import { MongooseModule } from '@nestjs/mongoose';
import { Customer, CustomerSchema } from './schemas/customer.schema';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Audience } from '../audiences/entities/audience.entity';
import {
  CustomerKeys,
  CustomerKeysSchema,
} from './schemas/customer-keys.schema';
import { AccountsModule } from '../accounts/accounts.module';
import { AuthModule } from '../auth/auth.module';
import { Workflow } from '../workflows/entities/workflow.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, Audience, Workflow]),
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
    ]),
    MongooseModule.forFeature([
      { name: CustomerKeys.name, schema: CustomerKeysSchema },
    ]),
    BullModule.registerQueue({
      name: 'customers',
    }),
    forwardRef(() => AuthModule),
    AccountsModule,
  ],
  controllers: [CustomersController],
  providers: [CustomersService, CustomersProcessor],
  exports: [CustomersService],
})
export class CustomersModule {}
