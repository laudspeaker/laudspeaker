import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SendgridEvent } from './entities/sendgrid-event.entity';
import { EventWebhook, EventWebhookHeader } from './eventWebhook';

@Injectable()
export class WebhooksService {
  private eventWebhook = new EventWebhook();

  constructor(
    @InjectRepository(SendgridEvent)
    private sendgridEventRepository: Repository<SendgridEvent>
  ) {}

  public async processSendgridData(
    publicKey: string,
    timestamp: string,
    data: any[]
  ) {
    // const key = this.eventWebhook.convertPublicKeyToECDSA(publicKey);
    // const d = this.eventWebhook.verifySignature(
    //   key,
    //   JSON.stringify(data),
    //   process.env.SENDGRID_WEBHOOK_VERIFICATION_KEY,
    //   timestamp
    // );

    for (const item of data) {
      const { audienceId, customerId, event, sg_message_id, timestamp } = item;
      await this.sendgridEventRepository.save({
        audienceId,
        customerId,
        messageId: sg_message_id,
        event,
        createdAt: new Date(timestamp).toUTCString(),
      });
    }
  }
}
