/* eslint-disable no-case-declarations */
import Mailgun from 'mailgun.js';
import formData from 'form-data';
import { Liquid } from 'liquidjs';
import { MailService } from '@sendgrid/mail';
import {
  ClickHouseEventProvider,
  ClickHouseMessage,
  WebhooksService,
} from '../../webhooks/webhooks.service';
import twilio from 'twilio';
import { PostHog } from 'posthog-node';
import * as admin from 'firebase-admin';
import { WebClient } from '@slack/web-api';
import {
  FallBackAction,
  WebhookMethod,
} from '@/api/templates/entities/template.entity';
import wait from '@/utils/wait';
import { fetch } from 'undici';

export enum MessageType {
  SMS = 'sms',
  EMAIL = 'email',
  FIREBASE = 'firebase',
  SLACK = 'slack',
  // WEBHOOK = 'webhook',
}

export class MessageSender {
  private client: WebClient = new WebClient();
  private MAXIMUM_SMS_LENGTH = 1600;
  private MAXIMUM_PUSH_LENGTH = 256;
  private MAXIMUM_PUSH_TITLE_LENGTH = 48;
  private tagEngine = new Liquid();
  private phClient = new PostHog(process.env.POSTHOG_KEY, {
    host: process.env.POSTHOG_HOST,
  });
  private messagesMap: Record<
    MessageType,
    (job: any) => Promise<ClickHouseMessage[] | void>
  > = {
    [MessageType.EMAIL]: async (job) => {
      return await this.handleEmail(
        job.subject,
        job.to,
        job.text,
        job.tags,
        job.eventProvider,
        job.key,
        job.from,
        job.stepID,
        job.customerID,
        job.templateID,
        job.accountID,
        job.email,
        job.domain,
        job.trackingEmail,
        job.cc
      );
    },
    [MessageType.SMS]: async (job) => {
      return await this.handleSMS(
        job.from,
        job.sid,
        job.token,
        job.to,
        job.text,
        job.tags,
        job.stepID,
        job.customerID,
        job.templateID,
        job.accountID,
        job.trackingEmail,
        job.smsProvider
      );
    },
    [MessageType.FIREBASE]: async (job) => {
      await this.handleFirebase(
        job.trackingEmail,
        job.firebaseCredentials,
        job.phDeviceToken,
        job.pushText,
        job.templateID,
        job.pushTitle,
        job.customerID,
        job.stepID,
        job.filteredTags,
        job.accountID
      );
    },
    [MessageType.SLACK]: async (job) => {
      await this.handleSlack(
        job.templateID,
        job.accountID,
        job.stepID,
        job.methodName,
        job.args,
        job.filteredTags,
        job.customerID,
        job.trackingEmail
      );
    },
    // [MessageType.WEBHOOK]: async (job) => {
    //   await this.handleWebhook(
    //     job.trackingEmail,
    //     job.firebaseCredentials,
    //     job.phDeviceToken,
    //     job.pushText,
    //     job.templateID,
    //     job.pushTitle,
    //     job.customerID,
    //     job.stepID,
    //     job.filteredTags,
    //     job.accountID
    //   );
    // },
  };

  constructor() {}

  async process(job: any): Promise<ClickHouseMessage[]> {
    return await this.messagesMap[job.name](job);
  }

  /**
   * Handle sending an email.
   * @param subject
   * @param to
   * @param text
   * @param tags
   * @param eventProvider
   * @param key
   * @param from
   * @param stepID
   * @param customerID
   * @param templateID
   * @param accountID
   * @param email Optional: only for mailgun
   * @param domain: optional: only for mailgun
   * @param trackingEmail Optional
   * @param cc
   * @returns
   */
  async handleEmail(
    subject: string,
    to: string,
    text: string,
    tags: any,
    eventProvider: ClickHouseEventProvider,
    key: string,
    from: string,
    stepID: string,
    customerID: string,
    templateID: string,
    accountID: string,
    email?: string,
    domain?: string,
    trackingEmail?: string,
    cc?: string[]
  ): Promise<ClickHouseMessage[]> {
    if (!to) {
      return;
    }
    let textWithInsertedTags, subjectWithInsertedTags: string | undefined;
    let ret: ClickHouseMessage[];
    try {
      if (text)
        textWithInsertedTags = await this.tagEngine.parseAndRender(
          text,
          tags || {},
          { strictVariables: true }
        );

      if (subject)
        subjectWithInsertedTags = await this.tagEngine.parseAndRender(
          subject,
          tags || {},
          { strictVariables: true }
        );
    } catch (err) {
      return [
        {
          stepId: stepID,
          createdAt: new Date().toUTCString(),
          customerId: customerID,
          event: 'error',
          eventProvider: eventProvider,
          messageId: null,
          templateId: String(templateID),
          userId: accountID,
          processed: false,
        },
      ];
    }

    let msg: any;
    switch (eventProvider) {
      case 'sendgrid':
        const sg = new MailService();
        sg.setApiKey(key);
        const sendgridMessage = await sg.send({
          from: from,
          to: to,
          cc: cc,
          subject: subjectWithInsertedTags,
          html: textWithInsertedTags,
          personalizations: [
            {
              to: to,
              customArgs: {
                stepId: stepID,
                customerId: customerID,
                templateId: templateID,
              },
              cc: cc,
            },
          ],
        });
        msg = sendgridMessage;
        ret = [
          {
            stepId: stepID,
            createdAt: new Date().toUTCString(),
            customerId: customerID,
            event: 'sent',
            eventProvider: ClickHouseEventProvider.SENDGRID,
            messageId: sendgridMessage[0].headers['x-message-id'],
            templateId: String(templateID),
            userId: accountID,
            processed: false,
          },
        ];
        break;
      case 'mailgun':
      default:
        const mailgun = new Mailgun(formData);
        const mg = mailgun.client({ username: 'api', key: key });
        const mailgunMessage = await mg.messages.create(domain, {
          from: `${from} <${email}@${domain}>`,
          to: to,
          cc: cc,
          subject: subjectWithInsertedTags,
          html: textWithInsertedTags,
          'v:stepId': stepID,
          'v:customerId': customerID,
          'v:templateId': templateID,
          'v:accountId': accountID,
        });
        msg = mailgunMessage;
        ret = [
          {
            stepId: stepID,
            createdAt: new Date().toUTCString(),
            customerId: customerID,
            event: 'sent',
            eventProvider: ClickHouseEventProvider.MAILGUN,
            messageId: mailgunMessage.id
              ? mailgunMessage.id.substring(1, mailgunMessage.id.length - 1)
              : '',
            templateId: String(templateID),
            userId: accountID,
            processed: false,
          },
        ];
        break;
    }
    if (trackingEmail) {
      this.phClient.capture({
        distinctId: trackingEmail,
        event: 'message sent',
        properties: {
          type: 'email',
          step: stepID,
          customer: customerID,
          template: templateID,
          provider: eventProvider,
        },
      });
    }

    return ret;
  }

  /**
   * Handle sending sms.
   * @param from
   * @param sid
   * @param token
   * @param to
   * @param text
   * @param tags
   * @param stepID
   * @param customerID
   * @param templateID
   * @param accountID
   * @param trackingEmail
   * @returns
   */
  async handleSMS(
    from: string,
    sid: string,
    token: string,
    to: string,
    text: string,
    tags: any,
    stepID: string,
    customerID: string,
    templateID: string,
    accountID: string,
    trackingEmail: string,
    smsProvider: string
  ): Promise<ClickHouseMessage[]> {
    if (!to) {
      return;
    }
    let textWithInsertedTags: string | undefined;

    let ret: ClickHouseMessage[];
    try {
      if (text) {
        textWithInsertedTags = await this.tagEngine.parseAndRender(
          text,
          tags || {},
          { strictVariables: true }
        );
      }
    } catch (err) {
      return [
        {
          stepId: stepID,
          createdAt: new Date().toUTCString(),
          customerId: customerID,
          event: 'error',
          eventProvider: smsProvider as ClickHouseEventProvider,
          messageId: null,
          templateId: String(templateID),
          userId: accountID,
          processed: false,
        },
      ];
    }

    switch (smsProvider) {
      case 'twilio':
        const twilioClient = twilio(sid, token);
        const message = await twilioClient.messages.create({
          body: textWithInsertedTags?.slice(0, this.MAXIMUM_SMS_LENGTH),
          from: from,
          to: to,
          statusCallback: `${process.env.TWILIO_WEBHOOK_ENDPOINT}?stepId=${stepID}&customerId=${customerID}&templateId=${templateID}`,
        });
        ret = [
          {
            stepId: stepID,
            createdAt: new Date().toUTCString(),
            customerId: customerID,
            event: 'sent',
            eventProvider: ClickHouseEventProvider.TWILIO,
            messageId: message.sid,
            templateId: String(templateID),
            userId: accountID,
            processed: false,
          },
        ];
        break;
      case 'msegat':
        const res = await fetch('https://www.msegat.com/gw/sendsms.php', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userName: sid,
            numbers: to,
            userSender: from,
            msg: textWithInsertedTags?.slice(0, this.MAXIMUM_SMS_LENGTH),
            msgEncoding: 'UTF8',
            apiKey: token,
          }),
        });

        const msegatResponse = await res.json();

        console.log(msegatResponse);
    }

    if (trackingEmail) {
      this.phClient.capture({
        distinctId: trackingEmail,
        event: 'message sent',
        properties: {
          type: 'sms',
          step: stepID,
          customer: customerID,
          template: templateID,
        },
      });
    }
    return ret;
  }

  /**
   *
   * @param trackingEmail
   * @param firebaseCredentials
   * @param phDeviceToken
   * @param pushText
   * @param templateID
   * @param pushTitle
   * @param customerID
   * @param stepID
   * @param filteredTags
   * @param accountID
   * @returns
   */
  async handleFirebase(
    trackingEmail: string,
    firebaseCredentials: string,
    phDeviceToken: string,
    pushText: string,
    templateID: string,
    pushTitle: string,
    customerID: string,
    stepID: string,
    filteredTags: any,
    accountID: string
  ): Promise<ClickHouseMessage[]> {
    if (!phDeviceToken) {
      return;
    }
    let textWithInsertedTags, titleWithInsertedTags: string | undefined;
    let ret: ClickHouseMessage[];
    try {
      textWithInsertedTags = await this.tagEngine.parseAndRender(
        pushText,
        filteredTags || {},
        { strictVariables: true }
      );

      titleWithInsertedTags = await this.tagEngine.parseAndRender(
        pushTitle,
        filteredTags || {},
        { strictVariables: true }
      );
    } catch (err) {
      return [
        {
          userId: accountID,
          event: 'error',
          createdAt: new Date().toUTCString(),
          eventProvider: ClickHouseEventProvider.FIREBASE,
          messageId: null,
          stepId: stepID,
          customerId: customerID,
          templateId: String(templateID),
          processed: false,
        },
      ];
    }
    let firebaseApp: admin.app.App;
    try {
      firebaseApp = admin.app(accountID);
    } catch (e: any) {
      if (e.code == 'app/no-app') {
        firebaseApp = admin.initializeApp(
          {
            credential: admin.credential.cert(JSON.parse(firebaseCredentials)),
          },
          accountID
        );
      } else {
        return [
          {
            userId: accountID,
            event: 'error',
            createdAt: new Date().toUTCString(),
            eventProvider: ClickHouseEventProvider.FIREBASE,
            messageId: null,
            stepId: stepID,
            customerId: customerID,
            templateId: String(templateID),
            processed: false,
          },
        ];
      }
    }

    const messaging = admin.messaging(firebaseApp);

    const messageId = await messaging.send({
      token: phDeviceToken,
      notification: {
        title: titleWithInsertedTags.slice(0, this.MAXIMUM_PUSH_TITLE_LENGTH),
        body: textWithInsertedTags.slice(0, this.MAXIMUM_PUSH_LENGTH),
      },
      android: {
        notification: {
          sound: 'default',
          clickAction: 'FLUTTER_NOTIFICATION_CLICK',
        },
      },
      apns: {
        payload: {
          aps: {
            badge: 1,
            sound: 'default',
          },
        },
      },
    });
    ret = [
      {
        stepId: stepID,
        customerId: customerID,
        createdAt: new Date().toUTCString(),
        event: 'sent',
        eventProvider: ClickHouseEventProvider.FIREBASE,
        messageId: messageId,
        templateId: String(templateID),
        userId: accountID,
        processed: false,
      },
    ];
    if (trackingEmail) {
      this.phClient.capture({
        distinctId: trackingEmail,
        event: 'message sent',
        properties: {
          type: 'firebase',
          step: stepID,
          customer: customerID,
          template: templateID,
        },
      });
    }
    return ret;
  }

  /**
   *
   * @param templateID
   * @param accountID
   * @param stepID
   * @param methodName
   * @param args
   * @param tags
   * @param customerID
   * @returns
   */
  async handleSlack(
    templateID: string,
    accountID: string,
    stepID: string,
    methodName: string,
    args: any,
    tags: any,
    customerID: string,
    trackingEmail: string
  ): Promise<ClickHouseMessage[]> {
    try {
      if (args.text) {
        args.text = await this.tagEngine.parseAndRender(args.text, tags || {}, {
          strictVariables: true,
        });
      }
      const message = await this.client.apiCall(methodName, {
        ...args,
      });
      return [
        {
          userId: accountID,
          event: 'sent',
          createdAt: new Date().toUTCString(),
          eventProvider: ClickHouseEventProvider.SLACK,
          messageId: String(message.ts),
          stepId: stepID,
          customerId: customerID,
          templateId: String(templateID),
          processed: false,
        },
      ];
    } catch (e) {
      return [
        {
          userId: accountID,
          event: 'error',
          createdAt: new Date().toUTCString(),
          eventProvider: ClickHouseEventProvider.SLACK,
          messageId: '',
          stepId: stepID,
          customerId: customerID,
          templateId: String(templateID),
          processed: false,
        },
      ];
    }
  }

  /**
   *
   * @param webhookData
   * @param filteredTags
   * @returns
   */
  // async handleWebhook(webhookData: any, filteredTags: any): Promise<ClickHouseMessage[]> {
  //   const { method, retries, fallBackAction } = webhookData;

  //   let { body, headers, url } = webhookData;

  //   url = await this.tagEngine.parseAndRender(url, filteredTags || {}, {
  //     strictVariables: true,
  //   });
  //   url = await this.templatesService.parseTemplateTags(url);

  //   if (
  //     [
  //       WebhookMethod.GET,
  //       WebhookMethod.HEAD,
  //       WebhookMethod.DELETE,
  //       WebhookMethod.OPTIONS,
  //     ].includes(method)
  //   ) {
  //     body = undefined;
  //   } else {
  //     body = await this.templatesService.parseTemplateTags(body);
  //     body = await this.tagEngine.parseAndRender(body, filteredTags || {}, {
  //       strictVariables: true,
  //     });
  //   }

  //   headers = Object.fromEntries(
  //     await Promise.all(
  //       Object.entries(headers).map(async ([key, value]) => [
  //         await this.templatesService.parseTemplateTags(
  //           await this.tagEngine.parseAndRender(key, filteredTags || {}, {
  //             strictVariables: true,
  //           })
  //         ),
  //         await this.templatesService.parseTemplateTags(
  //           await this.tagEngine.parseAndRender(value, filteredTags || {}, {
  //             strictVariables: true,
  //           })
  //         ),
  //       ])
  //     )
  //   );

  //   let retriesCount = 0;
  //   let success = false;

  //   let error: string | null = null;
  //   while (!success && retriesCount < retries) {
  //     try {
  //       const res = await fetch(url, {
  //         method,
  //         body,
  //         headers,
  //       });

  //       if (!res.ok) throw new Error('Error sending API request');
  //       success = true;
  //     } catch (e) {
  //       retriesCount++;
  //       if (e instanceof Error) error = e.message;
  //       await wait(5000);
  //     }
  //   }

  //   if (!success) {
  //     switch (fallBackAction) {
  //       case FallBackAction.NOTHING:
  //         break;
  //     }

  //     try {
  //       await this.webhooksService.insertClickHouseMessages([
  //         {
  //           event: 'error',
  //           createdAt: new Date().toUTCString(),
  //           eventProvider: ClickHouseEventProvider.WEBHOOKS,
  //           messageId: '',
  //           audienceId: job.data.audienceId,
  //           customerId: job.data.customerId,
  //           templateId: String(job.data.template.id),
  //           userId: job.data.accountId,
  //           processed: false,
  //         },
  //       ]);
  //     } catch (e) {
  //     }

  //     throw new Error(error);
  //   } else {
  //     try {
  //       await this.webhooksService.insertClickHouseMessages([
  //         {
  //           event: 'sent',
  //           createdAt: new Date().toUTCString(),
  //           eventProvider: ClickHouseEventProvider.WEBHOOKS,
  //           messageId: '',
  //           audienceId: job.data.audienceId,
  //           customerId: job.data.customerId,
  //           templateId: String(job.data.template.id),
  //           userId: job.data.accountId,
  //           processed: false,
  //         },
  //       ]);
  //     } catch (e) {
  //     }
  //   }

  //   return { url, body, headers };
  // }
}
