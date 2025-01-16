import { MigrationInterface, QueryRunner } from "typeorm"
import {
  ClickHouseClient,
} from '@/common/services/clickhouse';

export class CreateClickhouseMessageStatusPGSyncMV1736737126920 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      const clickhouseClient = new ClickHouseClient({
        url: process.env.CLICKHOUSE_HOST
          ? process.env.CLICKHOUSE_HOST.includes('http')
            ? process.env.CLICKHOUSE_HOST
            : `http://${process.env.CLICKHOUSE_HOST}`
          : 'http://localhost:8123',
        username: process.env.CLICKHOUSE_USER ?? 'default',
        password: process.env.CLICKHOUSE_PASSWORD ?? '',
        database: process.env.CLICKHOUSE_DB ?? 'default',
        max_open_connections: parseInt(process.env.CLICKHOUSE_MAX_OPEN_CONNECTIONS ?? '10'),
        keep_alive: { enabled: true }
      });

      await clickhouseClient.query({
        query: `
          DROP TABLE IF EXISTS message_status_sync_trigger;
        `
      });
      await clickhouseClient.query({
        query: `
          CREATE MATERIALIZED VIEW message_status_sync_trigger TO message_status_pg_sync
          AS SELECT
            now64() as pg_sync_published_at,
            *
          FROM message_status;
        `
      });
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }
}
