import { Process, Processor } from '@nestjs/bull';
import { Inject, LoggerService } from '@nestjs/common';
import { Job } from 'bull';
import { Injectable } from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Liquid } from 'liquidjs';
import twilio from 'twilio';

@Processor('sms')
@Injectable()
export class SmsProcessor {
  private tagEngine = new Liquid();

  private MAXIMUM_SMS_LENGTH = 1600;

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService
  ) {}
  @Process('send')
  async handleSend(job: Job) {
    let textWithInsertedTags: string;

    if (job.data.text) {
      textWithInsertedTags = await this.tagEngine.parseAndRender(
        job.data.text,
        job.data.tags || {}
      );
    }

    const twilioClient = twilio(job.data.sid, job.data.token);

    try {
      const message = await twilioClient.messages.create({
        body: textWithInsertedTags.slice(0, this.MAXIMUM_SMS_LENGTH),
        from: job.data.from,
        to: job.data.to,
      });

      this.logger.debug(
        `Sms with sid ${message.sid} status: ${JSON.stringify(message.status)}`
      );
    } catch (e) {
      this.logger.error(e);
    }
  }
}
