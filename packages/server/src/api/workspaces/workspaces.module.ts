import { Module, forwardRef } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountsModule } from '../accounts/accounts.module';
import { OrganizationsModule } from '../organizations/organizations.module';
import { WorkspaceMailgunConnection } from './entities/workspace-mailgun-connection.entity';
import { WorkspaceSendgridConnection } from './entities/workspace-sendgrid-connection.entity';
import { WorkspaceResendConnection } from './entities/workspace-resend-connection.entity';
import { MailgunSendingOption } from './entities/mailgun-sending-option.entity';
import { SendgridSendingOption } from './entities/sendgrid-sending-option.entity';
import { ResendSendingOption } from './entities/resend-sending-option.entity';
import { WorkspaceTwilioConnection } from './entities/workspace-twilio-connection.entity';
import { WorkspacePushConnection } from './entities/workspace-push-connection.entity';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { Workspace } from './entities/workspace.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Workspace,
      WorkspaceMailgunConnection,
      MailgunSendingOption,
      WorkspaceSendgridConnection,
      SendgridSendingOption,
      WorkspaceResendConnection,
      ResendSendingOption,
      WorkspaceTwilioConnection,
      WorkspacePushConnection,
    ]),
    forwardRef(() => WebhooksModule),
    forwardRef(() => AccountsModule),
    forwardRef(() => OrganizationsModule),
  ],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
  exports: [WorkspacesService],
})
export class WorkspacesModule {}
