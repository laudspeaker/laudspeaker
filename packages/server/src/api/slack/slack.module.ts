import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { SlackProcessor } from './slack.processor';
import { SlackController } from './slack.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Installation } from './entities/installation.entity';
import { SlackService } from './slack.service';
import { CustomersService } from '../customers/customers.service';
import { MongooseModule } from '@nestjs/mongoose';
import { CustomerSchema, Customer } from '../customers/schemas/customer.schema';
import { Account } from '../accounts/entities/accounts.entity';
import { Audience } from '../audiences/entities/audience.entity';
import { State } from './entities/state.entity';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'slack',
    }),
    BullModule.registerQueue({
      name: 'email',
    }),
    TypeOrmModule.forFeature([Installation, State, Account, Audience]),
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
    ]),
  ],
  controllers: [SlackController],
  providers: [SlackProcessor, SlackService, CustomersService],
})
export class SlackModule {}
