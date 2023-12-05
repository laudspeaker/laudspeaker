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
  private KAFKA_BROKERS = process.env.KAFKA_BROKERS.split(','); // Pass brokers as comma separated list
  private KAFKA_SASL_USERNAME = process.env.KAFKA_SASL_USERNAME; // Confluent cluster API key
  private KAFKA_SASL_PASSWORD = process.env.KAFKA_SASL_PASSWORD; // Confluent cluster API secret
  private KAFKA_SSL = !!this.KAFKA_SASL_PASSWORD && !!this.KAFKA_SASL_USERNAME; // SSL set when SASL user/pass given

  // Create the client with the broker list
  private kafka = new Kafka({
    clientId: 'laudspeaker-server',
    brokers: this.KAFKA_BROKERS,
    ssl: this.KAFKA_SSL,
    ...(this.KAFKA_SSL
      ? {
          sasl: {
            mechanism: 'plain',
            username: this.KAFKA_SASL_USERNAME,
            password: this.KAFKA_SASL_PASSWORD,
          },
        }
      : undefined),
  });

  private CACHE: { producer?: Producer } = {};

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService
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
      this.CACHE.producer = this.kafka.producer({
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
