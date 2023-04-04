/* eslint-disable no-case-declarations */
import { Process, Processor } from '@nestjs/bull';
import { Inject, LoggerService } from '@nestjs/common';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import Mailgun from 'mailgun.js';
import formData from 'form-data';
import { Liquid } from 'liquidjs';
import { MailService } from '@sendgrid/mail';
import {
  ClickHouseEventProvider,
  WebhooksService,
} from '../webhooks/webhooks.service';
import twilio from 'twilio';
import { PostHog } from 'posthog-node';
import { cert, App, getApp, initializeApp } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

@Processor('message')
@Injectable()
export class MessageProcessor {
  private MAXIMUM_SMS_LENGTH = 1600;
  private MAXIMUM_PUSH_LENGTH = 256;
  private MAXIMUM_PUSH_TITLE_LENGTH = 48;
  private tagEngine = new Liquid();
  private phClient = new PostHog(
    process.env.POSTHOG_KEY,
    { host: process.env.POSTHOG_HOST } // You can omit this line if using PostHog Cloud
  );

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly webhooksService: WebhooksService
  ) {}

  @Process('email')
  async handleEmail(job: Job) {
    if (!job.data.to) {
      this.logger.error(
        `Error: Skipping sending for ${
          job.data.customerId
        }, no email; job ${JSON.stringify(job.data)}`,
        `email.processor.ts:MessageProcessor.handleEmail()`
      );
      return;
    }
    let textWithInsertedTags, subjectWithInsertedTags: string | undefined;
    try {
      if (job.data.text)
        textWithInsertedTags = await this.tagEngine.parseAndRender(
          job.data.text,
          job.data.tags || {},
          { strictVariables: true }
        );

      if (job.data.subject)
        subjectWithInsertedTags = await this.tagEngine.parseAndRender(
          job.data.subject,
          job.data.tags || {},
          { strictVariables: true }
        );
    } catch (err) {
      this.logger.error(
        `Error: ${err} while parsing merge tags for job ${JSON.stringify(
          job.data
        )}`,
        `email.processor.ts:MessageProcessor.handleEmail()`
      );
      await this.webhooksService.insertClickHouseMessages([
        {
          audienceId: job.data.audienceId,
          createdAt: new Date().toUTCString(),
          customerId: job.data.customerId,
          event: 'error',
          eventProvider: job.data.eventProvider,
          messageId: null,
          templateId: String(job.data.templateId),
          userId: job.data.accountId,
        },
      ]);
      return;
    }

    try {
      let msg: any;
      switch (job.data.eventProvider) {
        case 'sendgrid':
          const sg = new MailService();
          sg.setApiKey(job.data.key);
          const sendgridMessage = await sg.send({
            from: job.data.from,
            to: job.data.to,
            cc: job.data.cc,
            subject: subjectWithInsertedTags,
            html: textWithInsertedTags,
            personalizations: [
              {
                to: job.data.to,
                customArgs: {
                  audienceId: job.data.audienceId,
                  customerId: job.data.customerId,
                  templateId: job.data.templateId,
                },
                cc: job.data.cc,
              },
            ],
          });
          msg = sendgridMessage;
          await this.webhooksService.insertClickHouseMessages([
            {
              audienceId: job.data.audienceId,
              createdAt: new Date().toUTCString(),
              customerId: job.data.customerId,
              event: 'sent',
              eventProvider: ClickHouseEventProvider.SENDGRID,
              messageId: sendgridMessage[0].headers['x-message-id'],
              templateId: String(job.data.templateId),
              userId: job.data.accountId,
            },
          ]);
          break;
        case 'mailgun':
        default:
          const mailgun = new Mailgun(formData);
          const mg = mailgun.client({ username: 'api', key: job.data.key });
          const mailgunMessage = await mg.messages.create(job.data.domain, {
            from: `${job.data.from} <${job.data.email}@${job.data.domain}>`,
            to: job.data.to,
            cc: job.data.cc,
            subject: subjectWithInsertedTags,
            html: textWithInsertedTags,
            'v:audienceId': job.data.audienceId,
            'v:customerId': job.data.customerId,
            'v:templateId': job.data.templateId,
            'v:accountId': job.data.accountId,
          });
          msg = mailgunMessage;
          await this.webhooksService.insertClickHouseMessages([
            {
              audienceId: job.data.audienceId,
              createdAt: new Date().toUTCString(),
              customerId: job.data.customerId,
              event: 'sent',
              eventProvider: ClickHouseEventProvider.MAILGUN,
              messageId: mailgunMessage.id
                ? mailgunMessage.id.substring(1, mailgunMessage.id.length - 1)
                : '',
              templateId: String(job.data.templateId),
              userId: job.data.accountId,
            },
          ]);
          break;
      }
      if (job.data.trackingEmail) {
        this.phClient.capture({
          distinctId: job.data.trackingEmail,
          event: 'message sent',
          properties: {
            type: 'email',
            audience: job.data.audienceId,
            customer: job.data.customerId,
            template: job.data.templateId,
            provider: job.data.eventProvider,
          },
        });
      }
      this.logger.debug(
        `${msg},${JSON.stringify(job.data)}`,
        `email.processor.ts:MessageProcessor.handleEmail()`
      );
    } catch (err) {
      this.logger.error(
        `Error: ${err} while processing job ${JSON.stringify(job.data)}`,
        `email.processor.ts:MessageProcessor.handleEmail()`
      );
    }
  }

  @Process('sms')
  async handleSMS(job: Job) {
    if (!job.data.to) {
      this.logger.error(
        `Error: Skipping sending for ${
          job.data.customerId
        }, no phone; job ${JSON.stringify(job.data)}`,
        `email.processor.ts:MessageProcessor.handleSMS()`
      );
      return;
    }
    let textWithInsertedTags: string | undefined;
    try {
      if (job.data.text) {
        textWithInsertedTags = await this.tagEngine.parseAndRender(
          job.data.text,
          job.data.tags || {},
          { strictVariables: true }
        );
      }
    } catch (err) {
      this.logger.error(
        `Error: ${err} while parsing merge tags for job ${JSON.stringify(
          job.data
        )}`,
        `email.processor.ts:MessageProcessor.handleSMS()`
      );
      await this.webhooksService.insertClickHouseMessages([
        {
          audienceId: job.data.audienceId,
          createdAt: new Date().toUTCString(),
          customerId: job.data.customerId,
          event: 'error',
          eventProvider: ClickHouseEventProvider.TWILIO,
          messageId: null,
          templateId: String(job.data.templateId),
          userId: job.data.accountId,
        },
      ]);
      return;
    }
    try {
      const twilioClient = twilio(job.data.sid, job.data.token);
      const message = await twilioClient.messages.create({
        body: textWithInsertedTags?.slice(0, this.MAXIMUM_SMS_LENGTH),
        from: job.data.from,
        to: job.data.to,
        statusCallback: `${process.env.TWILIO_WEBHOOK_ENDPOINT}?audienceId=${job.data.audienceId}&customerId=${job.data.customerId}&templateId=${job.data.templateId}`,
      });
      await this.webhooksService.insertClickHouseMessages([
        {
          audienceId: job.data.audienceId,
          createdAt: new Date().toUTCString(),
          customerId: job.data.customerId,
          event: 'sent',
          eventProvider: ClickHouseEventProvider.TWILIO,
          messageId: message.sid,
          templateId: String(job.data.templateId),
          userId: job.data.accountId,
        },
      ]);
      if (job.data.trackingEmail) {
        this.phClient.capture({
          distinctId: job.data.trackingEmail,
          event: 'message sent',
          properties: {
            type: 'sms',
            audience: job.data.audienceId,
            customer: job.data.customerId,
            template: job.data.templateId,
          },
        });
      }
      this.logger.debug(
        `${JSON.stringify(message)},${JSON.stringify(job.data)}`,
        `email.processor.ts:MessageProcessor.handleSMS()`
      );
    } catch (err) {
      this.logger.error(
        `Error: ${err} while processing job ${JSON.stringify(job.data)}`,
        `email.processor.ts:MessageProcessor.handleSMS()`
      );
    }
  }

  @Process('firebase')
  async handleFirebase(job: Job) {
    if (!job.data.phDeviceToken) {
      this.logger.error(
        `Error: Skipping sending for ${
          job.data.customerId
        }, no device token; job ${JSON.stringify(job.data)}`,
        `email.processor.ts:MessageProcessor.handleFirebase()`
      );
      return;
    }

    let textWithInsertedTags, titleWithInsertedTags: string | undefined;
    try {
      textWithInsertedTags = await this.tagEngine.parseAndRender(
        job.data.pushText,
        job.data.filteredTags || {},
        { strictVariables: true }
      );

      titleWithInsertedTags = await this.tagEngine.parseAndRender(
        job.data.pushTitle,
        job.data.filteredTags || {},
        { strictVariables: true }
      );
    } catch (err) {
      this.logger.error(
        `Error: ${err} while parsing merge tags for job ${JSON.stringify(
          job.data
        )}`,
        `email.processor.ts:MessageProcessor.handleFirebase()`
      );
      await this.webhooksService.insertClickHouseMessages([
        {
          userId: job.data.accountId,
          event: 'error',
          createdAt: new Date().toUTCString(),
          eventProvider: ClickHouseEventProvider.FIREBASE,
          messageId: null,
          audienceId: job.data.args.audienceId,
          customerId: job.data.args.customerId,
          templateId: String(job.data.args.templateId),
        },
      ]);
      return;
    }
    try {
      let firebaseApp: App;
      try {
        firebaseApp = getApp(job.data.accountId);
      } catch (e: any) {
        if (e.code == 'app/no-app') {
          firebaseApp = initializeApp(
            {
              credential: cert(JSON.parse(job.data.firebaseCredentials)),
            },
            job.data.accountId
          );
        } else throw e;
      }

      const messaging = getMessaging(firebaseApp);

      const messageId = await messaging.send({
        token: job.data.phDeviceToken,
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
      await this.webhooksService.insertClickHouseMessages([
        {
          audienceId: job.data.audienceId,
          customerId: job.data.customerId,
          createdAt: new Date().toUTCString(),
          event: 'sent',
          eventProvider: ClickHouseEventProvider.FIREBASE,
          messageId: messageId,
          templateId: String(job.data.templateId),
          userId: job.data.accountId,
        },
      ]);
      if (job.data.trackingEmail) {
        this.phClient.capture({
          distinctId: job.data.trackingEmail,
          event: 'message sent',
          properties: {
            type: 'firebase',
            audience: job.data.audienceId,
            customer: job.data.customerId,
            template: job.data.templateId,
          },
        });
      }
      this.logger.debug(
        `${messageId},${JSON.stringify(job.data)}`,
        `email.processor.ts:MessageProcessor.handleFirebase()`
      );
    } catch (err) {
      this.logger.error(
        `Error: ${err} while processing job ${JSON.stringify(job.data)}`,
        `email.processor.ts:MessageProcessor.handleFirebase()`
      );
    }
  }
}
