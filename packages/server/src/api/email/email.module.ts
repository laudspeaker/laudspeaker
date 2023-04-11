import { Module } from '@nestjs/common';
import { EmailController } from './email.controller';
import { MessageProcessor } from './email.processor';
import { BullModule } from '@nestjs/bullmq';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { Audience } from '../audiences/entities/audience.entity';
import { MongooseModule } from '@nestjs/mongoose';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import {
  CustomerKeys,
  CustomerKeysSchema,
} from '../customers/schemas/customer-keys.schema';
import { CustomersModule } from '../customers/customers.module';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'message',
    }),
    TypeOrmModule.forFeature([Account, Audience]),
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
    WebhooksModule,
  ],
  controllers: [EmailController],
  providers: [MessageProcessor],
})
export class EmailModule {}
