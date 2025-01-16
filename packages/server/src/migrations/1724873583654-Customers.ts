import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableIndex,
  TableForeignKey,
} from "typeorm"

export class Customers1724873583654 implements MigrationInterface {
  name = 'Customers1724873583654'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "customers",
        columns: [
          {
            name: "id",
            type: "bigserial",
            isPrimary: true,
          },
          {
            name: "uuid",
            type: "UUID",
            default: "uuid_generate_v7()"
          },
          {
            name: "user_attributes",
            type: "jsonb",
            default: "'{}'",
          },
          {
            name: "system_attributes",
            type: "jsonb",
            default: "'{}'",
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "updated_at",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "other_ids",
            type: "text array",
            default: "ARRAY[]::text[]",
          },
          {
            name: "workspace_id",
            type: "uuid",
          },
        ],
      })
    );

    await queryRunner.createForeignKey(
      "customers",
      new TableForeignKey({
        columnNames: ["workspace_id"],
        referencedColumnNames: ["id"],
        referencedTableName: "workspaces",
        onDelete: "CASCADE",
      })
    );

    await queryRunner.createIndices(
      "customers",
      [
        new TableIndex({
          name: "idx_customers_workspace",
          columnNames: ["workspace_id"]
        }),
        new TableIndex({
          name: "idx_customers_workspace_customer_id",
          columnNames: ["workspace_id", "id"]
        }),
        new TableIndex({
          name: "idx_customers_workspace_customer_uuid",
          columnNames: ["workspace_id", "uuid"],
          isUnique: true,
        }),
        new TableIndex({
          name: "idx_customers_workspace_customer_other_ids",
          columnNames: ["workspace_id", "other_ids"]
        }),
        new TableIndex({
          name: "idx_customers_workspace_customer_created_at",
          columnNames: ["workspace_id", "created_at"]
        }),
        new TableIndex({
          name: "idx_customers_workspace_customer_updated_at",
          columnNames: ["workspace_id", "updated_at"]
        }),
      ]
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }
}
