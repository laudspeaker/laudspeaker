/* eslint-disable prettier/prettier */
import { createClient } from '@clickhouse/client';
import { ClickHouseMessage } from '../entities/clickhouse';

export default class ClientFactory {
  private clickHouseClient = createClient({
    host: process.env.CLICKHOUSE_HOST
      ? process.env.CLICKHOUSE_HOST.includes('http')
        ? process.env.CLICKHOUSE_HOST
        : `http://${process.env.CLICKHOUSE_HOST}`
      : 'http://localhost:8123',
    username: process.env.CLICKHOUSE_USER ?? 'default',
    password: process.env.CLICKHOUSE_PASSWORD ?? '',
    database: process.env.CLICKHOUSE_DB ?? 'default',
  });

  public insertClickHouseMessages = async (values: ClickHouseMessage[]) => {
    await this.clickHouseClient.insert<ClickHouseMessage>({
      table: 'message_status',
      values,
      format: 'JSONEachRow',
    });
  };

  public toClickHouseDateTime = (date: Date): string => {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    const seconds = date.getSeconds().toString().padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  };

  public query = this.clickHouseClient.query;
  public insert = this.clickHouseClient.insert;
}

