import { Body, Controller, Post, Req } from '@nestjs/common';
import { Query } from '@nestjs/common/decorators';
import { Request } from 'express';
import { WebhooksService } from './webhooks.service';

@Controller('webhooks')
export class WebhooksController {
  constructor(private webhooksService: WebhooksService) {}

  @Post('sendgrid')
  public async processSendgridData(@Req() req: Request, @Body() data: any) {
    const signature = req.headers[
      'x-twilio-email-event-webhook-signature'
    ] as string;
    const timestamp = req.headers[
      'x-twilio-email-event-webhook-timestamp'
    ] as string;
    await this.webhooksService.processSendgridData(signature, timestamp, data);
  }

  @Post('twilio')
  public async processTwilioData(
    @Body()
    body: {
      SmsSid: string;
      SmsStatus: string;
      MessageStatus: string;
      To: string;
      MessageSid: string;
      AccountSid: string;
      From: string;
      ApiVersion: string;
    },
    @Query('audienceId') audienceId: string,
    @Query('customerId') customerId: string,
    @Query('templateId') templateId: string
  ) {
    await this.webhooksService.processTwilioData({
      ...body,
      audienceId,
      customerId,
      templateId,
    });
  }

  @Post('mailgun')
  public async processMailgunData(@Body() body: any) {
    await this.webhooksService.processMailgunData(body);
  }
}
