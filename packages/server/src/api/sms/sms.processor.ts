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
    let textWithInsertedTags: string | undefined;

    const { text, tags, audienceId, customerId, from, sid, to, token } =
      job.data;

    if (text) {
      textWithInsertedTags = await this.tagEngine.parseAndRender(
        text,
        tags || {}
      );
    }

    const twilioClient = twilio(sid, token);

    try {
      const message = await twilioClient.messages.create({
        body: textWithInsertedTags?.slice(0, this.MAXIMUM_SMS_LENGTH),
        from,
        to,
        statusCallback: `${process.env.TWILLIO_WEBHOOK_ENDPOINT}?audienceId=${audienceId}&customerId=${customerId}`,
      });

      this.logger.debug(
        `Sms with sid ${message.sid} status: ${JSON.stringify(message.status)}`
      );
    } catch (e: any) {
      this.logger.error(e);
    }
  }
}
