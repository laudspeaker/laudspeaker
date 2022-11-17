import { Process, Processor } from '@nestjs/bull';
import { Inject, LoggerService } from '@nestjs/common';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import Mailgun from 'mailgun.js';
import * as formData from 'form-data';
import { Liquid } from 'liquidjs';
import { MailService } from '@sendgrid/mail';

@Processor('email')
@Injectable()
export class EmailProcessor {
  private tagEngine = new Liquid();
  private sgMailService = new MailService();
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService
  ) {}
  @Process('send')
  async handleSend(job: Job) {
    this.logger.debug(JSON.stringify(job, null, 2));
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
          msg = await this.sgMailService.send({
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
                },
              },
            ],
          });
          break;
        case 'mailgun':
        default:
          msg = await mg.messages.create(job.data.domain, {
            from: `${job.data.from} <${job.data.email}@${job.data.domain}>`,
            to: job.data.to,
            subject: subjectWithInsertedTags,
            html: textWithInsertedTags,
            'v:audienceId': job.data.audienceId,
            'v:customerId': job.data.customerId,
          });
          break;
      }

      console.log('Email id: ' + msg?.id);
      this.logger.debug(
        'Response from message sending: ' + JSON.stringify(msg)
      );
    } catch (err) {
      this.logger.error('Error attempting to send email: ' + err);
    }
  }
}
