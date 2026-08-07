// import { EmailProvider } from '../interfaces/email.provider';
// import { SendingParams, SetupConnectionParams, SetupWebhookParams, HandleWebhookParams } from '../interfaces/email.data';
// import Mailgun from 'mailgun.js';
// import formData from 'form-data';
// import { ClickHouseMessage } from '../../../services/clickhouse/interfaces/clickhouse-message';
// import { ClickHouseEventProvider } from '@/common/services/clickhouse';
// import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
// import { createHmac } from 'crypto';
// import { BaseLiquidEngineProvider } from '../../interfaces/base.provider';

// @Injectable()
// export class SendgridProvider extends BaseLiquidEngineProvider implements EmailProvider {
//   private mailgunClient: any;
//   private MAILGUN_HOOKS_TO_INSTALL = [
//     'clicked',
//     'complained',
//     'delivered',
//     'opened',
//     'permanent_fail',
//     'temporary_fail',
//     'unsubscribed',
//   ];

//   constructor(private apiKey: string, private domain: string) {
//     super();
//     const mailgun = new Mailgun(formData);
//     this.mailgunClient = mailgun.client({ username: 'api', key: this.apiKey });
//   }

//   async fetchSetupInfo(apiKey: string): Promise<SetupInfo> {
//     const mailgun = new Mailgun(FormData);
//     const mg = mailgun.client({ username: 'api', key: key });
//     return _.filter(await mg.domains.list(), ['state', 'active']);;
//   }

//   async sendMessage(data: SendingParams): Promise<ClickHouseMessage[]> {
//     try {
//       const result = await this.mailgunClient.messages.create(this.domain, {
//         from: `${data.from} <${data.from}>`,
//         to: data.to,
//         cc: data.cc,
//         subject: data.subject,
//         html: data.text,
//         'v:stepId': data.stepID,
//         'v:customerId': data.customerID,
//         'v:templateId': data.templateID,
//         'v:workspaceId': data.workspaceId,
//       });

//       return [{
//         stepId: data.stepID,
//         createdAt: new Date(),
//         customerId: data.customerID,
//         event: 'sent',
//         eventProvider: ClickHouseEventProvider.MAILGUN,
//         messageId: result.id ? result.id.replace('<', '').replace('>', '') : '',
//         templateId: String(data.templateID),
//         workspaceId: data.workspaceId,
//         processed: false,
//       }];
//     } catch (error) {
//       return [{
//         stepId: data.stepID,
//         createdAt: new Date(),
//         customerId: data.customerID,
//         event: 'error',
//         eventProvider: ClickHouseEventProvider.MAILGUN,
//         messageId: '',
//         templateId: String(data.templateID),
//         workspaceId: data.workspaceId,
//         processed: false,
//       }];
//     }
//   }

//   async setupCallbackHandler(mailgunAPIKey: string, sendingDomain: string): Promise<void> {
//     const base64ApiKey = Buffer.from(`api:${mailgunAPIKey}`).toString('base64');
//     const headers = {
//       Authorization: `Basic ${base64ApiKey}`,
//       'Content-Type': 'application/x-www-form-urlencoded',
//     };

//     const updateWebhook = async (type: string) => {
//       const url = `https://api.mailgun.net/v3/domains/${sendingDomain}/webhooks/${type}`;
//       try {
//         const response = await fetch(url, {
//           method: 'PUT',
//           headers: headers,
//           body: new URLSearchParams({
//             url: process.env.MAILGUN_WEBHOOK_ENDPOINT,
//           }),
//         });

//         const data = await response.json();
//         return { status: response.status, body: data };
//       } catch (error) {
//         return { error };
//       }
//     };

//     const updateAllWebhooks = async () => {
//       const updatePromises = this.MAILGUN_HOOKS_TO_INSTALL.map((type) =>
//         updateWebhook(type)
//       );

//       const results = await Promise.allSettled(updatePromises);

//       results.forEach((result, index) => {
//         if (result.status === 'fulfilled' && result.value.status === 200) {
//           console.log(
//             `Webhook ${this.MAILGUN_HOOKS_TO_INSTALL[index]} updated successfully`
//           );
//         } else {
//           console.error(
//             `Failed to update webhook ${this.MAILGUN_HOOKS_TO_INSTALL[index]
//             }: ${JSON.stringify(result)}`
//           );
//         }
//       });
//     };

//     await updateAllWebhooks();
//   }
  
//   async handleCallbackData(
//     body: {
//       signature: { token: string; timestamp: string; signature: string };
//       'event-data': {
//         event: string;
//         message: { headers: { 'message-id': string } };
//         'user-variables': {
//           stepId: string;
//           customerId: string;
//           templateId: string;
//           accountId: string;
//         };
//       };
//     },
//     session: string
//   ):Promise<ClickHouseMessage[]> {
//     const {
//       timestamp: signatureTimestamp,
//       token: signatureToken,
//       signature,
//     } = body.signature;

//     const {
//       event,
//       message: {
//         headers: { 'message-id': id },
//       },
//       'user-variables': { stepId, customerId, templateId, accountId },
//     } = body['event-data'];

//     const account = await this.accountRepository.findOne({
//       where: { id: accountId },
//       relations: ['teams.organization.workspaces'],
//     });
//     if (!account) throw new NotFoundException('Account not found');

//     const value = signatureTimestamp + signatureToken;

//     const hash = createHmac(
//       'sha256',
//       account?.teams?.[0]?.organization?.workspaces?.[0]?.mailgunAPIKey ||
//         process.env.MAILGUN_API_KEY
//     )
//       .update(value)
//       .digest('hex');

//     if (hash !== signature) {
//       throw new ForbiddenException('Invalid signature');
//     }

//     if (!stepId || !customerId || !templateId || !id) return;

//     const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];
//     const clickHouseRecord: ClickHouseMessage = {
//       workspaceId: workspace.id,
//       stepId,
//       customerId,
//       templateId: String(templateId),
//       messageId: id,
//       event: event,
//       eventProvider: ClickHouseEventProvider.MAILGUN,
//       processed: false,
//       createdAt: new Date(),
//     };

//     return [clickHouseRecord];
//   }
// }
