import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { CustomersModule } from '../customers/customers.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { S3Service } from '../s3/s3.service';
import { JourneysModule } from '../journeys/journeys.module';
import { TemplatesModule } from '../templates/templates.module';
import { StepsModule } from '../steps/steps.module';
import { MongooseModule } from '@nestjs/mongoose';
import {
  CustomerKeys,
  CustomerKeysSchema,
} from '../customers/schemas/customer-keys.schema';
import { Account } from '../accounts/entities/accounts.entity';
import { OrganizationsController } from './organizations.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CustomerKeys.name, schema: CustomerKeysSchema },
    ]),
    TypeOrmModule.forFeature([Account]),
    forwardRef(() => AuthModule),
    forwardRef(() => CustomersModule),
    forwardRef(() => JourneysModule),
    forwardRef(() => TemplatesModule),
    forwardRef(() => StepsModule),
    WebhooksModule,
  ],
  controllers: [OrganizationsController],
  providers: [S3Service],
  exports: [],
})
export class OrganizationsModule {}

