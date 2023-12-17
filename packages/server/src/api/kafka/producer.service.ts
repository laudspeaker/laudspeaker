import { Kafka, Message, Producer, ProducerConfig } from 'kafkajs';
import {
  Inject,
  Injectable,
  LoggerService,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { KafkaService } from './kafka.service';

@Injectable()
export class KafkaProducerService implements OnModuleDestroy, OnModuleInit {
  private CACHE: { producer?: Producer } = {};

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private readonly kafkaService: KafkaService
  ) {}

  async onModuleInit() {
    // Initialize kafka producer and connect
    await this.getProducer();
  }
  async onModuleDestroy() {
    // Disconnect
    (await this.getProducer()).disconnect();
  }

  /**
   * Creates producer and connects, if one doesn't exist.
   * @returns kafkajs.Producer
   */
  private async getProducer() {
    if (this.CACHE.producer == null) {
      this.CACHE.producer = this.kafkaService.kafka.producer({
        allowAutoTopicCreation: true,
      });
      await this.CACHE.producer.connect();
    }
    return this.CACHE.producer!;
  }

  /**
   * Produce givent messages to kafka topic
   * @param topic
   */
  async produceMessage(
    topic: string,
    messages: Message[],
    otherConfig: Exclude<ProducerConfig, 'topic' | 'messages'> = {}
  ) {
    return (await this.getProducer()).send({ topic, messages, ...otherConfig });
  }
}
