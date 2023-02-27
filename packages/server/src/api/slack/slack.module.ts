import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { SlackProcessor } from './slack.processor';
import { SlackController } from './slack.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Installation } from './entities/installation.entity';
import { SlackService } from './slack.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomerSchema, Customer } from '../customers/schemas/customer.schema';
import { Account } from '../accounts/entities/accounts.entity';
import { Audience } from '../audiences/entities/audience.entity';
import { State } from './entities/state.entity';
import {
  CustomerKeys,
  CustomerKeysSchema,
} from '../customers/schemas/customer-keys.schema';
import { CustomersModule } from '../customers/customers.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'slack',
    }),
    BullModule.registerQueue({
      name: 'message',
    }),
    BullModule.registerQueue({
      name: 'customers',
    }),
    TypeOrmModule.forFeature([Account, Audience, Installation, State]),
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
      { name: CustomerKeys.name, schema: CustomerKeysSchema },
    ]),
    CustomersModule,
  ],
  controllers: [SlackController],
  providers: [SlackProcessor, SlackService],
  exports: [SlackService],
})
export class SlackModule {}
