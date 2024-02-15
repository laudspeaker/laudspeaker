import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Workspaces } from './entities/workspaces.entity';
import { AccountsModule } from '../accounts/accounts.module';
import { OrganizationsModule } from '../organizations/organizations.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Workspaces]),
    AccountsModule,
    OrganizationsModule,
  ],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
