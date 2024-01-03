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

    try {
      const workspaceIds = await queryRunner.query(`
        SELECT ws."id" AS workspace_id, org."ownerId" AS owner_id
        FROM "organization" org
        JOIN "workspaces" ws ON org."id" = ws."organizationId"
      `);

      const ownerIdToWorkspaceIdMap = {};
      workspaceIds.forEach((workspace) => {
        ownerIdToWorkspaceIdMap[workspace.owner_id] = workspace.workspace_id;
      });

      for (const [ownerId, workspaceId] of Object.entries(
        ownerIdToWorkspaceIdMap
      )) {
        await clickHouseClient.query({
          query: `ALTER TABLE message_status UPDATE workspaceId = '${workspaceId}' WHERE userId = '${ownerId}'`,
        });
      }

      await clickHouseClient.query({
        query: `ALTER TABLE message_status DROP COLUMN IF EXISTS userId`,
      });
    } catch (error) {
      console.error('Migration failed:', error);
      throw error;
    } finally {
      await clickHouseClient.close();
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}

