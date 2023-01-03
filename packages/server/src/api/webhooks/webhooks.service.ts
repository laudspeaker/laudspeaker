import { ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { WebhookEvent } from './entities/webhook-event.entity';
import { PublicKey, Signature, Ecdsa } from 'starkbank-ecdsa';
import { Audience } from '../audiences/entities/audience.entity';
import { Account } from '../accounts/entities/accounts.entity';

const sendgridEventsMap = {
  click: 'clicked',
  open: 'opened',
};

@Injectable()
export class WebhooksService {
  constructor(
    @InjectRepository(WebhookEvent)
    private webhookEventRepository: Repository<WebhookEvent>,
    @InjectRepository(Audience)
    private audienceRepository: Repository<Audience>,
    @InjectRepository(Account)
    private accountRepository: Repository<Account>
  ) {}

  public async processSendgridData(
    signature: string,
    timestamp: string,
    data?: any[]
  ) {
    const audienceId = data?.[0]?.audienceId;
    if (!audienceId) return;

    const {
      owner: { id: accountId },
    } = await this.audienceRepository.findOneBy({
      id: audienceId,
    });

    const { sendgridVerificationKey } = await this.accountRepository.findOneBy({
      id: accountId,
    });
    if (!sendgridVerificationKey) return;

    const publicKey = PublicKey.fromPem(sendgridVerificationKey);

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
      await this.webhookEventRepository.save({
        audience: { id: audienceId },
        customerId,
        messageId: sg_message_id,
        event: sendgridEventsMap[event] || event,
        eventProvider: 'sendgrid',
        createdAt: new Date(timestamp * 1000).toUTCString(),
      });
    }
  }

  public async processTwillioData({
    audienceId,
    customerId,
    SmsStatus,
    MessageSid,
  }: {
    audienceId: string;
    customerId: string;
    SmsStatus: string;
    MessageSid: string;
  }) {
    await this.webhookEventRepository.save({
      audience: { id: audienceId },
      customerId,
      messageId: MessageSid,
      event: SmsStatus,
      eventProvider: 'twillio',
      createdAt: new Date().toUTCString(),
    });
  }
}
