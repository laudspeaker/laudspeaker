import { MailgunSendingOption } from '@/api/workspaces/entities/mailgun-sending-option.entity';
import { ResendSendingOption } from '@/api/workspaces/entities/resend-sending-option.entity';
import { SendgridSendingOption } from '@/api/workspaces/entities/sendgrid-sending-option.entity';
import { WorkspaceMailgunConnection } from '@/api/workspaces/entities/workspace-mailgun-connection.entity';
import { WorkspacePushConnection } from '@/api/workspaces/entities/workspace-push-connection.entity';
import { WorkspaceResendConnection } from '@/api/workspaces/entities/workspace-resend-connection.entity';
import { WorkspaceSendgridConnection } from '@/api/workspaces/entities/workspace-sendgrid-connection.entity';
import { WorkspaceTwilioConnection } from '@/api/workspaces/entities/workspace-twilio-connection.entity';
import { Workspace } from '@/api/workspaces/entities/workspace.entity';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class TransferConnectionsToSeparateTables1708424773506
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const workspaces = await queryRunner.manager.find(Workspace);

    for (const workspace of workspaces) {
      if (
        workspace.mailgunAPIKey &&
        workspace.sendingDomain &&
        workspace.sendingEmail &&
        workspace.sendingEmail
      ) {
        const mailgunConnection = await queryRunner.manager.save(
          WorkspaceMailgunConnection,
          {
            workspace: { id: workspace.id },
            name: 'Email (mailgun)',
            apiKey: workspace.mailgunAPIKey,
            sendingDomain: workspace.sendingDomain,
          }
        );

        await queryRunner.manager.save(MailgunSendingOption, [
          {
            mailgunConnection: { id: mailgunConnection.id },
            sendingEmail: workspace.sendingEmail,
            sendingName: workspace.sendingName,
          },
        ]);
      }

      if (workspace.sendgridApiKey && workspace.sendgridFromEmail) {
        const sendgridConnection = await queryRunner.manager.save(
          WorkspaceSendgridConnection,
          {
            workspace: { id: workspace.id },
            name: 'Email (sendgrid)',
            apiKey: workspace.sendgridApiKey,
            verificationKey: workspace.sendgridVerificationKey || '',
          }
        );

        await queryRunner.manager.save(SendgridSendingOption, [
          {
            sendgridConnection: { id: sendgridConnection.id },
            sendingEmail: workspace.sendgridFromEmail,
          },
        ]);
      }

      if (
        workspace.resendAPIKey &&
        workspace.resendSendingDomain &&
        workspace.resendSendingEmail &&
        workspace.resendSendingName &&
        workspace.resendSigningSecret
      ) {
        const resendConnection = await queryRunner.manager.save(
          WorkspaceResendConnection,
          {
            workspace: { id: workspace.id },
            name: 'Email (resend)',
            apiKey: workspace.resendAPIKey,
            sendingDomain: workspace.resendSendingDomain,
            signingSecret: workspace.resendSigningSecret,
          }
        );

        await queryRunner.manager.save(ResendSendingOption, [
          {
            resendConnection: { id: resendConnection.id },
            sendingEmail: workspace.resendSendingEmail,
            sendingName: workspace.resendSendingName,
          },
        ]);
      }

      if (
        workspace.smsAccountSid &&
        workspace.smsAuthToken &&
        workspace.smsFrom
      ) {
        await queryRunner.manager.save(WorkspaceTwilioConnection, [
          {
            workspace: { id: workspace.id },
            name: 'Twilio SMS',
            sid: workspace.smsAccountSid,
            token: workspace.smsAuthToken,
            from: workspace.smsFrom,
          },
        ]);
      }

      if (
        workspace.pushPlatforms &&
        Object.keys(workspace.pushPlatforms).length !== 0
      ) {
        await queryRunner.manager.save(WorkspacePushConnection, [
          {
            workspace: { id: workspace.id },
            name: 'Push',
            pushPlatforms: workspace.pushPlatforms,
          },
        ]);
      }
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
