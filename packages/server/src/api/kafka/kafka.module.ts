import { Module } from '@nestjs/common';
import { RedisModule } from '@liaoliaots/nestjs-redis';
import { KafkaService } from './kafka.service';

@Module({
  providers: [KafkaService],
  exports: [KafkaService],
})
export class KafkaModule {}
