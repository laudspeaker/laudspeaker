import { Injectable } from '@nestjs/common';
import {
  RedisService,
  DEFAULT_REDIS_NAMESPACE,
} from '@liaoliaots/nestjs-redis';
import Redis from 'ioredis';
import Redlock, { Lock } from 'redlock';

@Injectable()
export class RedlockService {
  private readonly redis: Redis;
  private redlock: Redlock;

  constructor(private readonly redisService: RedisService) {
    this.redis = this.redisService.getClient();
    this.redlock = new Redlock([this.redis]);
  }

  async acquire(lockName: string): Promise<Lock> {
    return await this.redlock.acquire([lockName], 60000, { retryCount: -1 });
  }

  retrieve(resources: any, value: any, attempts, expiration): Lock {
    return new Lock(this.redlock, resources, value, attempts, expiration);
  }
}
