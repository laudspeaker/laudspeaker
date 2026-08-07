import { MigrationInterface, QueryRunner } from "typeorm"
import { formatMongoConnectionString } from '@/app.module';
import {
  ClickHouseClient,
  ClickHouseTable,
  ClickHouseEvent,
} from '@/common/services/clickhouse';

export class MigrateEventsFromMongoToClickhouse1727222269995 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      console.log(`RMQ_CONNECTION_URI: ${process.env.RMQ_CONNECTION_URI}`);
      try {
        const lib = require('mongoose');

        const mongoose = new lib.Mongoose();
        await this.migrateEvents(queryRunner, mongoose);
        console.log("Events have been successfully migrated from MongoDB to Clickhouse");

      } catch(err) {
        console.log("mongoose not found. Skipping migrating events from MongoDB to Clickhouse");
      }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
      throw new Error("Irreversible migration");
    }

    private async migrateEvents(
      queryRunner: QueryRunner,
      mongoose
    ) {
      const mg = await mongoose.connect(
        formatMongoConnectionString(process.env.MONGOOSE_URL)
      );

      const clickhouseOptions: Record <string, any> = {
        url: process.env.CLICKHOUSE_HOST
          ? process.env.CLICKHOUSE_HOST.includes('http')
            ? process.env.CLICKHOUSE_HOST
            : `http://${process.env.CLICKHOUSE_HOST}`
          : 'http://localhost:8123',
        username: process.env.CLICKHOUSE_USER ?? 'default',
        password: process.env.CLICKHOUSE_PASSWORD ?? '',
        database: process.env.CLICKHOUSE_DB ?? 'default',
        max_open_connections: process.env.CLICKHOUSE_MAX_OPEN_CONNECTIONS ?? 10,
        keep_alive: { enabled: true }
      }
      const clickhouseClient = new ClickHouseClient(clickhouseOptions);
      
      const collection = mg.connection.db.collection('events');
      const mongoEvents = await collection.find().toArray();

      let clickHouseRecord: ClickHouseEvent;
      const eventsToInsert: ClickHouseEvent[] = [];

      for (let event of mongoEvents) {
        clickHouseRecord = {
          uuid: event.uuid,
          generated_at: event.timestamp,
          correlation_key: event.correlationKey,
          correlation_value: event.correlationValue,
          created_at: event.createdAt,
          event: event.event,
          payload: event.payload,
          source: event.source,
          workspace_id: event.workspaceId,
        };

        eventsToInsert.push(clickHouseRecord);
      }

      await clickhouseClient.insert({
        table: ClickHouseTable.EVENTS,
        values: eventsToInsert,
        format: 'JSONEachRow',
      });

      try {
      } catch (error) {
        throw error;
      } finally {
        await mg.disconnect();
        await clickhouseClient.disconnect();
      }
    }
}
