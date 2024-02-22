import { Module } from '@nestjs/common';
import { WorkspacesController } from './workspaces.controller';
import { WorkspacesService } from './workspaces.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WorkspaceMailgunConnection } from './entities/workspace-mailgun-connection.entity';
import { WorkspaceSendgridConnection } from './entities/workspace-sendgrid-connection.entity';
import { WorkspaceResendConnection } from './entities/workspace-resend-connection.entity';
import { MailgunSendingOption } from './entities/mailgun-sending-option.entity';
import { SendgridSendingOption } from './entities/sendgrid-sending-option.entity';
import { ResendSendingOption } from './entities/resend-sending-option.entity';
import { WorkspaceTwilioConnection } from './entities/workspace-twilio-connection.entity';
import { WorkspacePushConnection } from './entities/workspace-push-connection.entity';
import { WebhooksModule } from '../webhooks/webhooks.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      WorkspaceMailgunConnection,
      MailgunSendingOption,
      WorkspaceSendgridConnection,
      SendgridSendingOption,
      WorkspaceResendConnection,
      ResendSendingOption,
      WorkspaceTwilioConnection,
      WorkspacePushConnection,
    ]),
    WebhooksModule,
  ],
  controllers: [WorkspacesController],
  providers: [WorkspacesService],
})
export class WorkspacesModule {}
