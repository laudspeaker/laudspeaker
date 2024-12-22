import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from "typeorm"

export class CreateEventsTable1728261544991 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "events",
        columns: [
          {
            name: "id",
            type: "bigint",
            isPrimary: true,
          },
          {
            name: "uuid",
            type: "UUID",
          },
          {
            name: "created_at",
            type: "timestamp",
          },
          {
            name: "generated_at",
            type: "timestamp",
          },
          {
            name: "pg_sync_published_at",
            type: "timestamp",
          },
          {
            name: "pg_sync_completed_at",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "correlation_key",
            type: "varchar",
          },
          {
            name: "correlation_value",
            type: "varchar",
          },
          {
            name: "event",
            type: "varchar",
          },
          {
            name: "payload",
            type: "jsonb",
          },
          {
            name: "context",
            type: "jsonb",
          },
          {
            name: "source",
            type: "varchar",
          },
          {
            name: "customer_id",
            type: "bigint",
            isNullable: true
          },
          {
            name: "workspace_id",
            type: "UUID",
          },
        ],
      })
    );

    // await queryRunner.createForeignKey(
    //   "events",
    //   new TableForeignKey({
    //       columnNames: ["customer_id"],
    //       referencedColumnNames: ["id"],
    //       referencedTableName: "customer",
    //       onDelete: "NO ACTION",
    //   })
    // );

    await queryRunner.createIndices(
      "events",
      [
        new TableIndex({
          name: "idx_workspace_id",
          columnNames: ["workspace_id"]
        }),
        new TableIndex({
          name: "idx_generated_at",
          columnNames: ["workspace_id", "generated_at"]
        }),
        new TableIndex({
          name: "idx_event",
          columnNames: ["workspace_id", "event"]
        }),
        new TableIndex({
          name: "idx_multiple_1",
          columnNames: ["workspace_id", "customer_id", "event",
            "generated_at", "payload"]
        }),
        new TableIndex({
          name: "idx_multiple_2",
          columnNames: ["workspace_id", "customer_id", "event", "payload"]
        }),
      ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }

}
