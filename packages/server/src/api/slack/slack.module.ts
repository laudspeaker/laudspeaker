import { forwardRef, Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
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
import { WebhooksService } from '../webhooks/webhooks.service';
import { Step } from '../steps/entities/step.entity';
import { KafkaModule } from '../kafka/kafka.module';
import { Workspaces } from '../workspaces/entities/workspaces.entity';

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
    TypeOrmModule.forFeature([
      Account,
      Audience,
      Installation,
      State,
      Step,
      Workspaces,
    ]),
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
      { name: CustomerKeys.name, schema: CustomerKeysSchema },
    ]),
    forwardRef(() => CustomersModule),
    KafkaModule,
  ],
  controllers: [SlackController],
  providers: [SlackProcessor, SlackService, WebhooksService],
  exports: [SlackService],
})
export class SlackModule {}
