import { Process, Processor } from '@nestjs/bull';
import { Inject, LoggerService } from '@nestjs/common';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import Mailgun from 'mailgun.js';
import * as formData from 'form-data';
import { Liquid } from 'liquidjs';

const tagEngine = new Liquid();

@Processor('email')
@Injectable()
export class EmailProcessor {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService
  ) {}
  @Process('send')
  async handleSend(job: Job) {
    const mailgun = new Mailgun(formData);
    const mg = mailgun.client({ username: 'api', key: job.data.key });

    const textWithInsertedTags = await tagEngine.parseAndRender(
      job.data.text,
      job.data.tags || {}
    );

    try {
      const msg = await mg.messages.create(job.data.domain, {
        from: `${job.data.from} <${job.data.email}@${job.data.domain}>`,
        to: job.data.to,
        subject: job.data.subject,
        html: textWithInsertedTags,
      });
      this.logger.debug(
        'Response from message sending: ' + JSON.stringify(msg)
      );
    } catch (err) {
      this.logger.error(err);
    } // logs any error
  }
}
