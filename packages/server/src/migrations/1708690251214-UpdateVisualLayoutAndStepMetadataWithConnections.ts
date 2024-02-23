/* eslint-disable no-case-declarations */
import { Journey } from '@/api/journeys/entities/journey.entity';
import { Step } from '@/api/steps/entities/step.entity';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateVisualLayoutAndStepMetadataWithConnections1708690251214
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const stream = await queryRunner.stream(
      `SELECT 
          journey.id as "journeyId", workspace.id as "workspaceId", "visualLayout", workspace."emailProvider" as "emailProvider", journey.name as "name",
          "workspace_mailgun_connection".id as "mailgunConnectionId",
          "mailgun_sending_option".id as "mailgunSendingOptionId",
          "workspace_sendgrid_connection".id as "sendgridConnectionId",
          "sendgrid_sending_option".id as "sendgridSendingOptionId",
          "workspace_resend_connection".id as "resendConnectionId",
          "resend_sending_option".id as "resendSendingOptionId",
          "workspace_twilio_connection".id as "twilioConnectionId",
          "workspace_push_connection".id as "pushConnectionId"
        FROM "journey"
        LEFT JOIN "workspace" ON workspace.id = journey."workspaceId"
        LEFT JOIN "workspace_mailgun_connection" ON workspace.id = "workspace_mailgun_connection"."workspaceId"
        LEFT JOIN "mailgun_sending_option" ON "workspace_mailgun_connection".id = "mailgun_sending_option"."mailgunConnectionId"
        LEFT JOIN "workspace_sendgrid_connection" ON workspace.id = "workspace_sendgrid_connection"."workspaceId"
        LEFT JOIN "sendgrid_sending_option" ON "workspace_sendgrid_connection".id = "sendgrid_sending_option"."sendgridConnectionId"
        LEFT JOIN "workspace_resend_connection" ON workspace.id = "workspace_resend_connection"."workspaceId"
        LEFT JOIN "resend_sending_option" ON "workspace_resend_connection".id = "resend_sending_option"."resendConnectionId"
        LEFT JOIN "workspace_twilio_connection" ON workspace.id = "workspace_twilio_connection"."workspaceId"
        LEFT JOIN "workspace_push_connection" ON workspace.id = "workspace_push_connection"."workspaceId"`
    );

    for await (const record of stream) {
      const visualLayout = record.visualLayout;
      if (!visualLayout) continue;

      for (const node of visualLayout.nodes) {
        if (
          (node.type === 'message' || node.type === 'push') &&
          (node.data.type === 'message' || node.data.type === 'push')
        ) {
          switch (node.data?.template?.type) {
            case 'email':
              let connectionId: string;
              let sendingOptionId: string;
              switch (record.emailProvider) {
                case 'mailgun':
                  connectionId = record.mailgunConnectionId;
                  sendingOptionId = record.mailgunSendingOptionId;
                  break;
                case 'sendgrid':
                  connectionId = record.sendgridConnectionId;
                  sendingOptionId = record.sendgridSendingOptionId;
                  break;
                case 'resend':
                  connectionId = record.resendConnectionId;
                  sendingOptionId = record.resendSendingOptionId;
                  break;
                default:
                  break;
              }

              node.data.connectionId = connectionId;
              node.data.sendingOptionId = sendingOptionId;
              const step = await queryRunner.manager.findOneBy(Step, {
                id: node.data.stepId,
              });
              if (!step) continue;

              step.metadata.connectionId = connectionId;
              step.metadata.sendingOptionId = sendingOptionId;
              await queryRunner.manager.save(step);
              break;
            case 'sms':
              node.data.connectionId = record.twilioConnectionId;
              const smsStep = await queryRunner.manager.findOneBy(Step, {
                id: node.data.stepId,
              });
              if (!smsStep) continue;

              smsStep.metadata.connectionId = record.twilioConnectionId;
              await queryRunner.manager.save(smsStep);
              break;
            case 'push':
              node.data.connectionId = record.pushConnectionId;
              const pushStep = await queryRunner.manager.findOneBy(Step, {
                id: node.data.stepId,
              });
              if (!pushStep) continue;

              pushStep.metadata.connectionId = record.pushConnectionId;
              await queryRunner.manager.save(pushStep);
              break;
            default:
              break;
          }
        }
      }

      await queryRunner.manager.save(Journey, {
        id: record.journeyId,
        visualLayout,
      });
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
