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
import { OrganizationService } from './organizations.service';
import { Workspaces } from '../workspaces/entities/workspaces.entity';
import { Organization } from './entities/organization.entity';
import { OrganizationTeam } from './entities/organization-team.entity';
import { AuthHelper } from '../auth/auth.helper';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: CustomerKeys.name, schema: CustomerKeysSchema },
    ]),
    TypeOrmModule.forFeature([
      Account,
      Workspaces,
      Organization,
      OrganizationTeam,
    ]),
    forwardRef(() => AuthModule),
    WebhooksModule,
  ],
  controllers: [OrganizationsController],
  providers: [S3Service, OrganizationService],
  exports: [OrganizationService],
})
export class OrganizationsModule {}

