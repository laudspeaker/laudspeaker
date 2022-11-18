import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SendgridEvent } from './entities/sendgrid-event.entity';
import { PublicKey, Signature, Ecdsa } from 'starkbank-ecdsa';

const eventsMap = {
  click: 'clicked',
  open: 'opened',
};

@Injectable()
export class WebhooksService {
  constructor(
    @InjectRepository(SendgridEvent)
    private sendgridEventRepository: Repository<SendgridEvent>
  ) {}

  public async processSendgridData(
    signature: string,
    timestamp: string,
    data: any[]
  ) {
    const publicKey = PublicKey.fromPem(
      process.env.SENDGRID_WEBHOOK_VERIFICATION_KEY
    );

    const decodedSignature = Signature.fromBase64(signature);
    const timestampPayload = timestamp + JSON.stringify(data) + '\r\n';

    const validSignature = Ecdsa.verify(
      timestampPayload,
      decodedSignature,
      publicKey
    );
    if (!validSignature) throw new ForbiddenException('Invalid signature');

    for (const item of data) {
      const { audienceId, customerId, event, sg_message_id, timestamp } = item;
      if (!audienceId || !customerId || !event || !sg_message_id || !timestamp)
        continue;
      await this.sendgridEventRepository.save({
        audienceId,
        customerId,
        messageId: sg_message_id,
        event: eventsMap[event] || event,
        createdAt: new Date(timestamp * 1000).toUTCString(),
      });
    }
  }
}
