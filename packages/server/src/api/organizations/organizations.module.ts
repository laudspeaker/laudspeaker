import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from '../auth/auth.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { S3Service } from '../s3/s3.service';
import { Account } from '../accounts/entities/accounts.entity';
import { OrganizationsController } from './organizations.controller';
import { OrganizationService } from './organizations.service';
import { Workspaces } from '../workspaces/entities/workspaces.entity';
import { Organization } from './entities/organization.entity';
import { OrganizationTeam } from './entities/organization-team.entity';
import { OrganizationInvites } from './entities/organization-invites.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      Workspaces,
      Organization,
      OrganizationTeam,
      OrganizationInvites,
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => WebhooksModule),
  ],
  controllers: [OrganizationsController],
  providers: [S3Service, OrganizationService],
  exports: [OrganizationService],
})
export class OrganizationsModule {}
