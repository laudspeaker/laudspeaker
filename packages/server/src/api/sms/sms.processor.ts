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
  ) { }

  @Process('send')
  async handleSend(
    job: Job<{
      sid: string;
      token: string;
      from: string;
      to: string;
      tags: Record<string, string>;
      text: string;
      audienceId: string;
      customerId: string;
    }>
  ) {
    try {
      this.logger.debug(
        `Starting SMS sending from ${job?.data?.from} to ${JSON.stringify(job?.data?.to)}`
      );
      let textWithInsertedTags: string | undefined;

      const { text, tags, audienceId, customerId, from, sid, to, token } =
        job.data;

      if (text) {
        textWithInsertedTags = await this.tagEngine.parseAndRender(
          text,
          tags || {}
        );
      }

      this.logger.debug(
        `Finished rendering tags in SMS from ${job?.data?.from} to ${JSON.stringify(job?.data?.to)}`
      );
      const twilioClient = twilio(sid, token);


      const message = await twilioClient.messages.create({
        body: textWithInsertedTags?.slice(0, this.MAXIMUM_SMS_LENGTH),
        from,
        to,
        statusCallback: `${process.env.TWILIO_WEBHOOK_ENDPOINT}?audienceId=${audienceId}&customerId=${customerId}`,
      });

      this.logger.debug(
        `Sms with sid ${message.sid} status: ${JSON.stringify(message.status)}`
      );
    } catch (e) {
      this.logger.error(e);
    }
  }
}
