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
import { createClient } from '@clickhouse/client';
import {
  ClickHouseEventProvider,
  WebhooksService,
} from '../webhooks/webhooks.service';
import twilio from 'twilio';
import { PostHog } from 'posthog-node';

@Processor('message')
@Injectable()
export class MessageProcessor {
  private MAXIMUM_SMS_LENGTH = 1600;
  private tagEngine = new Liquid();
  private sgMailService = new MailService();
  private phClient = new PostHog(
    process.env.POSTHOG_KEY,
    { host: process.env.POSTHOG_HOST } // You can omit this line if using PostHog Cloud
  );

  private clickhouseClient = createClient({
    host: process.env.CLICKHOUSE_HOST
      ? process.env.CLICKHOUSE_HOST.includes('http')
        ? process.env.CLICKHOUSE_HOST
        : `http://${process.env.CLICKHOUSE_HOST}`
      : 'http://localhost:8123',
    username: process.env.CLICKHOUSE_USER ?? 'default',
    password: process.env.CLICKHOUSE_PASSWORD ?? '',
  });

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly webhooksService: WebhooksService
  ) {}

  @Process('email')
  async handleEmail(job: Job) {
    const mailgun = new Mailgun(formData);
    const mg = mailgun.client({ username: 'api', key: job.data.key });

    let textWithInsertedTags, subjectWithInsertedTags;
    if (job.data.text)
      textWithInsertedTags = await this.tagEngine.parseAndRender(
        job.data.text,
        job.data.tags || {}
      );

    if (job.data.subject)
      subjectWithInsertedTags = await this.tagEngine.parseAndRender(
        job.data.subject,
        job.data.tags || {}
      );

    try {
      let msg: any;
      switch (job.data.eventProvider) {
        case 'sendgrid':
          this.sgMailService.setApiKey(job.data.key);
          const sendgridMessage = await this.sgMailService.send({
            from: job.data.from,
            to: job.data.to,
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
              },
            ],
          });
          msg = sendgridMessage;

          await this.webhooksService.insertClickHouseMessages([
            {
              event: 'sent',
              createdAt: new Date().toUTCString(),
              eventProvider: ClickHouseEventProvider.SENDGRID,
              messageId: sendgridMessage[0].headers['x-message-id'],
              audienceId: job.data.audienceId,
              customerId: job.data.customerId,
              templateId: String(job.data.templateId),
            },
          ]);
          break;
        case 'mailgun':
        default:
          const mailgunMessage = await mg.messages.create(job.data.domain, {
            from: `${job.data.from} <${job.data.email}@${job.data.domain}>`,
            to: job.data.to,
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
              event: 'sent',
              createdAt: new Date().toUTCString(),
              eventProvider: ClickHouseEventProvider.MAILGUN,
              messageId: mailgunMessage.id
                ? mailgunMessage.id.substring(1, mailgunMessage.id.length - 1)
                : '',
              audienceId: job.data.audienceId,
              customerId: job.data.customerId,
              templateId: String(job.data.templateId),
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
          },
        });
      }
      this.logger.debug(
        'Response from message sending: ' + JSON.stringify(msg)
      );
    } catch (err) {
      this.logger.error('Error attempting to send email: ' + err);
    }
  }

  @Process('sms')
  async handleSMS(job: Job) {
    try {
      if (!job.data.to) {
        this.logger.warn(
          `Customer ${job.data.customerId} has no phone number; skipping`
        );
        return;
      }
      this.logger.debug(
        `Starting SMS sending from ${job.data.from} to ${job.data.to}`
      );
      let textWithInsertedTags: string | undefined;

      if (job.data.text) {
        textWithInsertedTags = await this.tagEngine.parseAndRender(
          job.data.text,
          job.data.tags || {}
        );
      }

      this.logger.debug(
        `Finished rendering tags in SMS from ${job.data.from} to ${job.data.to}`
      );
      const twilioClient = twilio(job.data.sid, job.data.token);

      const message = await twilioClient.messages.create({
        body: textWithInsertedTags?.slice(0, this.MAXIMUM_SMS_LENGTH),
        from: job.data.from,
        to: job.data.to,
        statusCallback: `${process.env.TWILIO_WEBHOOK_ENDPOINT}?audienceId=${job.data.audienceId}&customerId=${job.data.customerId}&templateId=${job.data.templateId}`,
      });
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
        `Sms with sid ${message.sid} status: ${JSON.stringify(message.status)}`
      );
    } catch (e) {
      this.logger.error(e);
    }
  }
}
