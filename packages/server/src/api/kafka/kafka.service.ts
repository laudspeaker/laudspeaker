import { Kafka, Message, Producer, ProducerConfig } from 'kafkajs';
import {
  Inject,
  Injectable,
  LoggerService,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class KafkaService implements OnModuleDestroy, OnModuleInit {
  private KAFKA_BROKERS = process.env.KAFKA_BROKERS.split(',');
  // Create the client with the broker list
  private kafka = new Kafka({
    clientId: 'laudspeaker-server',
    brokers: this.KAFKA_BROKERS,
  });

  private CACHE: { producer?: Producer } = {};

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService
  ) {}

  onModuleInit() {
    // Initialize kafka producer and connect
    this.logger.warn('KAFKA INITIALIZED');
    this.getProducer();
  }
  onModuleDestroy() {
    // Disconnect
    this.logger.warn('KAFKA DISCONNECTED');
    this.getProducer().disconnect();
  }

  /**
   * Creates producer and connects, if one doesn't exist.
   * @returns kafkajs.Producer
   */
  private getProducer() {
    this.logger.warn('KAFKA PRODUCER GET ');
    if (this.CACHE.producer == null) {
      this.logger.warn('KAFKA INITIALIZED V2');
      this.CACHE.producer = this.kafka.producer({
        allowAutoTopicCreation: true,
      });
      this.CACHE.producer.connect();
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
    await this.getProducer().send({ topic, messages, ...otherConfig });
  }
}
