/* eslint-disable no-case-declarations */
import { OnWorkerEvent, Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, LoggerService } from '@nestjs/common';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import Mailgun from 'mailgun.js';
import formData from 'form-data';
import { Liquid } from 'liquidjs';
import { MailService } from '@sendgrid/mail';
import {
  ClickHouseEventProvider, ClickHouseMessage,
} from '../../webhooks/webhooks.service';
import twilio from 'twilio';
import { PostHog } from 'posthog-node';
import * as admin from 'firebase-admin';
import { template } from 'lodash';

export enum MessageType {
  SMS = 'sms',
  EMAIL = 'email',
  FIREBASE = 'firebase',
}

export class MessageSender {
  private MAXIMUM_SMS_LENGTH = 1600;
  private MAXIMUM_PUSH_LENGTH = 256;
  private MAXIMUM_PUSH_TITLE_LENGTH = 48;
  private tagEngine = new Liquid();
  private phClient = new PostHog(process.env.POSTHOG_KEY, {
    host: process.env.POSTHOG_HOST,
  });
  private messagesMap: Record<
    MessageType,
    (job: any) => Promise<void>
  > = {
      [MessageType.EMAIL]: async (job) => {
        await this.handleEmail(job.);
      },
      [MessageType.SMS]: async (job) => {
        await this.handleSMS(job);
      },
      [MessageType.FIREBASE]: async (job) => {
        await this.handleFirebase(job);
      },
    };

  constructor(
  ) {
  }

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
  async handleEmail(subject: string, to: string, text: string, tags: any, eventProvider: ClickHouseEventProvider, key: string, from: string, stepID: string, customerID: string, templateID: string, accountID: string, email?: string, domain?: string, trackingEmail?: string, cc?: string[]): Promise<any> {
    if (!to) {
      return;
    }
    let textWithInsertedTags, subjectWithInsertedTags: string | undefined;
    let ret: ClickHouseMessage[]
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
      ret = [
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
      return ret;
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
  async handleSMS(from: string, sid: string, token: string, to: string, text: string, tags: any, stepID: string, customerID: string, templateID: string, accountID: string, trackingEmail:string) {
    if (!to) {
      return;
    }
    let textWithInsertedTags: string | undefined;

    let ret: ClickHouseMessage[]
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
          eventProvider: ClickHouseEventProvider.TWILIO,
          messageId: null,
          templateId: String(templateID),
          userId: accountID,
          processed: false,
        },
      ];

    }
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

  async handleFirebase(job: Job) {
    if (!job.data.phDeviceToken) {
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
          processed: false,
        },
      ]);
      throw err;
    }
    let firebaseApp: admin.app.App;
    try {
      firebaseApp = admin.app(job.data.accountId);
    } catch (e: any) {
      if (e.code == 'app/no-app') {
        firebaseApp = admin.initializeApp(
          {
            credential: admin.credential.cert(
              JSON.parse(job.data.firebaseCredentials)
            ),
          },
          job.data.accountId
        );
      } else throw e;
    }

    const messaging = admin.messaging(firebaseApp);

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
        processed: false,
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
  }
}
