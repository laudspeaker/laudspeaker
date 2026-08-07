import {
  OnModuleDestroy,
  Injectable,
  Logger
} from '@nestjs/common';
import {
  createClient,
  QueryParams,
  QueryResult,
  InsertParams,
  InsertResult,
  ClickHouseSettings,
  ClickHouseClientConfigOptions,
  ResultSet,
  type DataFormat
} from '@clickhouse/client';
import {
  QueryParamsWithFormat
} from '@clickhouse/client-common'

@Injectable()
export class ClickHouseClient implements OnModuleDestroy {
  private client;

  private readonly commonSettings: ClickHouseSettings = {
    date_time_input_format: 'best_effort',
    output_format_json_array_of_rows: 1,
  };

  private readonly insertSettings: ClickHouseSettings = {
    ...this.commonSettings,
  };

  private readonly insertAsyncSettings: ClickHouseSettings = {
    ...this.commonSettings,
    async_insert: 1,
    wait_for_async_insert: 1,
    async_insert_max_data_size:
      process.env.CLICKHOUSE_MESSAGE_STATUS_ASYNC_MAX_SIZE
      ?? '1000000',
    async_insert_busy_timeout_ms: 
      process.env.CLICKHOUSE_MESSAGE_STATUS_ASYNC_TIMEOUT_MS ?
      +process.env.CLICKHOUSE_MESSAGE_STATUS_ASYNC_TIMEOUT_MS :
      1000,
  };

  constructor(options: ClickHouseClientConfigOptions) {
    this.client = createClient(options);
  }

  async query<Format extends DataFormat = 'JSON'>(
    params: QueryParamsWithFormat<Format>,
  ): Promise<QueryResult<Format>> {
    return this.client.query(params) as Promise<ResultSet<Format>>
  }

  async insert(
    params: InsertParams
  ): Promise<InsertResult> {
    const options = params.clickhouse_settings ?? {};

    params = {
      ...params,
      clickhouse_settings: {
        ...options,
        ...this.insertSettings
      },
    };

    return this.client.insert(params);
  }

  async insertAsync(
    params: InsertParams
  ): Promise<InsertResult> {
    const insertParams: InsertParams = {
      ...params,
      clickhouse_settings: {
        ...this.insertAsyncSettings
      },
    };

    return this.insert(insertParams);
  }

  async disconnect() {
    return this.client.close();
  }
  
  async onModuleDestroy() {
    await this.disconnect();
  }
}
