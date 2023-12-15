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
export class KafkaService {
  private KAFKA_BROKERS = process.env.KAFKA_BROKERS.split(','); // Pass brokers as comma separated list
  private KAFKA_SASL_USERNAME = process.env.KAFKA_SASL_USERNAME; // Confluent cluster API key
  private KAFKA_SASL_PASSWORD = process.env.KAFKA_SASL_PASSWORD; // Confluent cluster API secret
  private KAFKA_SSL = !!this.KAFKA_SASL_PASSWORD && !!this.KAFKA_SASL_USERNAME; // SSL set when SASL user/pass given

  // Create the client with the broker list
  public kafka = new Kafka({
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
}
