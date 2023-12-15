import {
  Inject,
  Injectable,
  OnApplicationShutdown,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import {
  Consumer,
  ConsumerConfig,
  ConsumerRunConfig,
  ConsumerSubscribeTopics,
  KafkaMessage,
} from 'kafkajs';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { KafkaService } from './kafka.service';

@Injectable()
export class KafkaConsumerService implements OnModuleDestroy {
  private KAFKA_BROKERS = process.env.KAFKA_BROKERS.split(',');
  // Create the client with the broker list

  private readonly consumers: Consumer[] = [];

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    private readonly kafkaService: KafkaService
  ) {}

  async consume(
    topic: ConsumerSubscribeTopics,
    config: ConsumerConfig,
    runConfig: ConsumerRunConfig
  ) {
    const consumer = this.kafkaService.kafka.consumer(config);
    await consumer.connect();
    await consumer.subscribe(topic);
    await consumer.run(runConfig);
    this.consumers.push(consumer);
  }

  async onModuleDestroy() {
    this.logger.error('STOP ME');
    for (const consumer of this.consumers) {
      await consumer.disconnect();
    }
  }
}

