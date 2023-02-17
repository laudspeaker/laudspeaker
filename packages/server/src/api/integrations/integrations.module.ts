import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from '../accounts/accounts.module';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import { Database } from './entities/database.entity';
import { Integration } from './entities/integration.entity';
import { IntegrationsController } from './integrations.controller';
import { IntegrationsProcessor } from './integrations.processor';
import { IntegrationsService } from './integrations.service';

@Module({
  imports: [
    AccountsModule,
    TypeOrmModule.forFeature([Integration, Database]),
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
    ]),
    BullModule.registerQueue({
      name: 'integrations',
    }),
  ],
  controllers: [IntegrationsController],
  providers: [IntegrationsService, IntegrationsProcessor],
  exports: [IntegrationsService],
})
export class IntegrationsModule {}
