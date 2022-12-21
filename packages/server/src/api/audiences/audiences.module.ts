import { Module } from '@nestjs/common';
import { AudiencesController } from './audiences.controller';
import { AudiencesService } from './audiences.service';
import { Audience } from './entities/audience.entity';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CustomersService } from '../customers/customers.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import { Template } from '../templates/entities/template.entity';
import { TemplatesService } from '../templates/templates.service';
import { SlackService } from '../slack/slack.service';
import { BullModule } from '@nestjs/bull';
import { Installation } from '../slack/entities/installation.entity';
import { State } from '../slack/entities/state.entity';
import { Account } from '../accounts/entities/accounts.entity';
import { Stats } from './entities/stats.entity';
import { Workflow } from '../workflows/entities/workflow.entity';
import {
  CustomerKeys,
  CustomerKeysSchema,
} from '../customers/schemas/customer-keys.schema';
import { CustomersModule } from '../customers/customers.module';
import { TemplatesModule } from '../templates/templates.module';
import { SlackModule } from '../slack/slack.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      State,
      Audience,
      Template,
      Installation,
      Workflow,
      Stats,
    ]),
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
    ]),
    MongooseModule.forFeature([
      { name: CustomerKeys.name, schema: CustomerKeysSchema },
    ]),
    BullModule.registerQueue({
      name: 'email',
    }),
    BullModule.registerQueue({
      name: 'slack',
    }),
    BullModule.registerQueue({
      name: 'customers',
    }),
    CustomersModule,
    TemplatesModule,
    SlackModule,
  ],
  controllers: [AudiencesController],
  providers: [AudiencesService],
  exports: [AudiencesService],
})
export class AudiencesModule {}
