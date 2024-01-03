import { createClient } from '@clickhouse/client';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class ClickHouseWorkspaceIdFill1704290212934
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    const clickHouseClient = createClient({
      host: process.env.CLICKHOUSE_HOST
        ? process.env.CLICKHOUSE_HOST.includes('http')
          ? process.env.CLICKHOUSE_HOST
          : `http://${process.env.CLICKHOUSE_HOST}`
        : 'http://localhost:8123',
      username: process.env.CLICKHOUSE_USER ?? 'default',
      password: process.env.CLICKHOUSE_PASSWORD ?? '',
      database: process.env.CLICKHOUSE_DB ?? 'default',
    });
    throw new Error('');
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}

