import { DynamicModule, Module, Provider } from '@nestjs/common';
import { ClickHouseClient } from './clickhouse-client';

@Module({})
export class ClickHouseModule {
  static register(options: Record <string, any>): DynamicModule {

    const provider: Provider = {
      provide: ClickHouseClient,
      useValue: new ClickHouseClient(options)
    };

    return {
      global: true,
      module: ClickHouseModule,
      providers: [provider],
      exports: [provider]
    }
  }
}
