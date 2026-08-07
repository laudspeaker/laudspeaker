import { DynamicModule, Module } from '@nestjs/common';
import { QueueExplorer } from './queue.explorer';
import { DiscoveryModule } from '@nestjs/core';

@Module({})
export class QueueModule {
  static forRoot(options: Record<string, any>): DynamicModule {
    const configProvider = {
      provide: 'RMQ_CONFIG_OPTIONS',
      useValue: options,
    };

    return {
      module: QueueModule,
      imports: [DiscoveryModule],
      providers: [configProvider, QueueExplorer],
    };
  }
}