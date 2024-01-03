/* eslint-disable no-case-declarations */
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Inject, LoggerService } from '@nestjs/common';
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
import * as admin from 'firebase-admin';
import nodemailer from 'nodemailer';
import { InjectRepository } from '@nestjs/typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { Repository } from 'typeorm';
import { workspacesUrl } from 'twilio/lib/jwt/taskrouter/util';

export enum MessageType {
  SMS = 'sms',
  EMAIL = 'email',
  PUSH_FIREBASE = 'push_firebase',
}

@Injectable()
@Processor('message', { removeOnComplete: { age: 0, count: 0 } })
export class MessageProcessor extends WorkerHost {
  private MAXIMUM_SMS_LENGTH = 1600;
  private MAXIMUM_PUSH_LENGTH = 256;
  private MAXIMUM_PUSH_TITLE_LENGTH = 48;
  private tagEngine = new Liquid();
  private phClient = new PostHog(process.env.POSTHOG_KEY, {
    host: process.env.POSTHOG_HOST,
  });
  private messagesMap: Record<
    MessageType,
    (job: Job<any, any, string>) => Promise<void>
  > = {
    [MessageType.EMAIL]: async (job) => {
      await this.handleEmail(job);
    },
    [MessageType.SMS]: async (job) => {
      await this.handleSMS(job);
    },
    [MessageType.PUSH_FIREBASE]: async (job) => {
      await this.handleFirebase(job);
    },
  };

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly webhooksService: WebhooksService,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>
  ) {
    super();
  }

  async process(job: Job<any, any, string>): Promise<any> {
    await this.messagesMap[job.name](job);
  }

  @OnWorkerEvent('active')
  onActive(job: Job<any, any, any>, prev: string) {
    this.logger.debug(
      `${JSON.stringify(job)} ${prev}`,
      `email.processor.ts:MessageProcessor.onActive()`
    );
  }

  @OnWorkerEvent('closed')
  onClosed() {
    this.logger.debug(``, `email.processor.ts:MessageProcessor.onClosed()`);
  }

  @OnWorkerEvent('closing')
  onClosing(msg: string) {
    this.logger.debug(
      `${msg}`,
      `email.processor.ts:MessageProcessor.onClosing()`
    );
  }

  @OnWorkerEvent('completed')
  onCompleted(job: Job<any, any, any>, result: any, prev: string) {
    this.logger.debug(
      `${JSON.stringify(job)} ${result} ${prev}`,
      `email.processor.ts:MessageProcessor.onCompleted()`
    );
  }

  @OnWorkerEvent('drained')
  onDrained() {
    this.logger.debug(``, `email.processor.ts:MessageProcessor.onDrained()`);
  }

  @OnWorkerEvent('error')
  onError(failedReason: Error) {
    this.logger.debug(
      `${failedReason}`,
      `templates.service.ts.ts:MessageProcessor.onError()`
    );
  }

  @OnWorkerEvent('failed')
  onFailed(job: Job<any, any, any> | undefined, error: Error, prev: string) {
    this.logger.debug(
      `${JSON.stringify(job)} ${error} ${prev}`,
      `email.processor.ts:MessageProcessor.onFailed()`
    );
  }

  @OnWorkerEvent('paused')
  onPaused() {
    this.logger.debug(``, `email.processor.ts:MessageProcessor.onPaused()`);
  }

  @OnWorkerEvent('progress')
  onProgress(job: Job<any, any, any>, progress: number | object) {
    this.logger.debug(
      `${JSON.stringify(job)} ${progress}`,
      `email.processor.ts:MessageProcessor.onProgress()`
    );
  }

  @OnWorkerEvent('ready')
  onReady() {
    this.logger.debug(``, `email.processor.ts:MessageProcessor.onReady()`);
  }

  @OnWorkerEvent('resumed')
  onResumed() {
    this.logger.debug(``, `email.processor.ts:MessageProcessor.onResumed()`);
  }

  @OnWorkerEvent('stalled')
  onStalled(jobId: string, prev: string) {
    this.logger.debug(
      `${jobId} ${prev}`,
      `email.processor.ts:MessageProcessor.onStalled()`
    );
  }

  async handleEmail(job: Job<any, any, string>): Promise<any> {
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
    const account = await this.accountRepository.findOne({
      where: { id: job.data.accountId },
      relations: ['teams.organization.workspaces'],
    });
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

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

      await this.webhooksService.insertMessageStatusToClickhouse([
        {
          audienceId: job.data.audienceId,
          createdAt: new Date().toISOString(),
          customerId: job.data.customerId,
          event: 'error',
          eventProvider: job.data.eventProvider,
          messageId: null,
          templateId: String(job.data.templateId),
          workspaceId: workspace?.id,
          processed: false,
        },
      ]);
      return;
    }

    try {
      let msg: any;
      switch (job.data.eventProvider) {
        case 'sendgrid':
          console.log('Inside of message sending');
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
          console.log('Inside of message sending');
          await this.webhooksService.insertMessageStatusToClickhouse([
            {
              audienceId: job.data.audienceId,
              createdAt: new Date().toISOString(),
              customerId: job.data.customerId,
              event: 'sent',
              eventProvider: ClickHouseEventProvider.SENDGRID,
              messageId: sendgridMessage[0].headers['x-message-id'],
              templateId: String(job.data.templateId),
              workspaceId: workspace.id,
              processed: false,
            },
          ]);
          break;
        case 'gmail':
          const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: job.data.email,
              pass: job.data.key,
            },
          });
          console.log('about to send an email via gmail');
          transporter
            .sendMail({
              from: `${job.data.from}`, // sender address
              to: job.data.to, // list of receivers
              subject: subjectWithInsertedTags, // Subject line
              text: job.data.plainText, //textWithInsertedTags, // plain text body
              html: textWithInsertedTags,
            })
            .then((info) => {
              console.log({ info });
            })
            .catch((error) => {
              console.log('Error occurred:', error);
            });
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
          await this.webhooksService.insertMessageStatusToClickhouse([
            {
              audienceId: job.data.audienceId,
              createdAt: new Date().toISOString(),
              customerId: job.data.customerId,
              event: 'sent',
              eventProvider: ClickHouseEventProvider.MAILGUN,
              messageId: mailgunMessage.id
                ? mailgunMessage.id.substring(1, mailgunMessage.id.length - 1)
                : '',
              templateId: String(job.data.templateId),
              workspaceId: workspace.id,
              processed: false,
            },
          ]);
          break;
      }
      if (job.data.trackingEmail) {
        this.phClient.capture({
          distinctId: job.data.trackingEmail,
          event: 'message_sent',
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
    const account = await this.accountRepository.findOne({
      where: { id: job.data.accountId },
      relations: ['teams.organization.workspaces'],
    });
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

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
      await this.webhooksService.insertMessageStatusToClickhouse([
        {
          audienceId: job.data.audienceId,
          createdAt: new Date().toISOString(),
          customerId: job.data.customerId,
          event: 'error',
          eventProvider: ClickHouseEventProvider.TWILIO,
          messageId: null,
          templateId: String(job.data.templateId),
          workspaceId: workspace.id,
          processed: false,
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
      await this.webhooksService.insertMessageStatusToClickhouse([
        {
          audienceId: job.data.audienceId,
          createdAt: new Date().toISOString(),
          customerId: job.data.customerId,
          event: 'sent',
          eventProvider: ClickHouseEventProvider.TWILIO,
          messageId: message.sid,
          templateId: String(job.data.templateId),
          workspaceId: workspace.id,
          processed: false,
        },
      ]);
      if (job.data.trackingEmail) {
        this.phClient.capture({
          distinctId: job.data.trackingEmail,
          event: 'message_sent',
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
    const account = await this.accountRepository.findOne({
      where: { id: job.data.accountId },
      relations: ['teams.organization.workspaces'],
    });
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

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
      await this.webhooksService.insertMessageStatusToClickhouse([
        {
          workspaceId: workspace.id,
          event: 'error',
          createdAt: new Date().toISOString(),
          eventProvider: ClickHouseEventProvider.PUSH,
          messageId: null,
          audienceId: job.data.args.audienceId,
          customerId: job.data.args.customerId,
          templateId: String(job.data.args.templateId),
          processed: false,
        },
      ]);
      return;
    }
    try {
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
      await this.webhooksService.insertMessageStatusToClickhouse([
        {
          audienceId: job.data.audienceId,
          customerId: job.data.customerId,
          createdAt: new Date().toISOString(),
          event: 'sent',
          eventProvider: ClickHouseEventProvider.PUSH,
          messageId: messageId,
          templateId: String(job.data.templateId),
          workspaceId: workspace.id,
          processed: false,
        },
      ]);
      if (job.data.trackingEmail) {
        this.phClient.capture({
          distinctId: job.data.trackingEmail,
          event: 'message_sent',
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
