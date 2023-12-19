import { Module } from '@nestjs/common';
import { KafkaConsumerService } from './consumer.service';
import { KafkaService } from './kafka.service';
import { KafkaProducerService } from './producer.service';

@Module({
  providers: [KafkaProducerService, KafkaConsumerService, KafkaService],
  exports: [KafkaProducerService, KafkaConsumerService],
})
export class KafkaModule {}
