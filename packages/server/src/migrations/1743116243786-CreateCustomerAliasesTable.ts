import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateCustomerAliasesTable1743116243786 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: "customer_aliases",
        columns: [
          {
            name: "id",
            type: "bigserial",
            isPrimary: true,
          },
          {
            name: "created_at",
            type: "timestamp",
            default: "now()",
          },
          {
            name: "customer_id",
            type: "bigint",
          },
          {
            name: "uuid",
            type: "UUID",
          },
          {
            name: "workspace_id",
            type: "UUID",
          },
        ],
      })
    );

    await queryRunner.createForeignKeys(
      "customer_aliases",
      [
        new TableForeignKey({
            columnNames: ["customer_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "customers",
            onDelete: "CASCADE",
        }),
        new TableForeignKey({
            columnNames: ["workspace_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "workspaces",
            onDelete: "CASCADE",
        }),        
      ]
    );

    await queryRunner.createIndices(
      "customer_aliases",
      [
        new TableIndex({
          name: "idx_customer_aliases_workspace_id",
          columnNames: ["workspace_id"]
        }),
        new TableIndex({
          name: "idx_customer_aliases_created_at",
          columnNames: ["workspace_id", "created_at"]
        }),
        new TableIndex({
          name: "idx_customer_aliases_customer_id",
          columnNames: ["workspace_id", "customer_id"]
        }),
        new TableIndex({
          name: "idx_customer_aliases_customer_id",
          columnNames: ["workspace_id", "uuid"]
        }),
        new TableIndex({
          name: "idx_customer_aliases_multiple_1",
          columnNames: ["workspace_id", "customer_id", "uuid"],
          isUnique: true
        }),
      ]);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }

}
