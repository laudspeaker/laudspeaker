import {
  MigrationInterface,
  QueryRunner,
  TableForeignKey,
  TableIndex,
  Table,
} from "typeorm"

export class CreateJourneyVersionsTable1737586945534 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
      await queryRunner.createTable(
        new Table({
          name: "journey_versions",
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
              name: "journey_id",
              type: "uuid",
            },
            {
              name: "number",
              type: "integer",
            },
            {
              name: "layout",
              type: "jsonb",
            },
            {
              name: "state",
              type: "varchar",
            },
            {
              name: "created_at",
              type: "timestamp",
              default: "now()",
            },
            {
              name: "created_by",
              type: "uuid",
            },
            {
              name: "updated_at",
              type: "timestamp",
              default: "now()",
            },
            {
              name: "updated_by",
              type: "uuid",
            },
            {
              name: "workspace_id",
              type: "uuid",
            },
          ],
        })
      );

      await queryRunner.createForeignKeys(
        "journey_versions",
        [
          new TableForeignKey({
            columnNames: ["journey_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "journey",
            onDelete: "NO ACTION",
          }),
          new TableForeignKey({
            columnNames: ["created_by"],
            referencedColumnNames: ["id"],
            referencedTableName: "account",
            onDelete: "NO ACTION",
          }),
          new TableForeignKey({
            columnNames: ["updated_by"],
            referencedColumnNames: ["id"],
            referencedTableName: "account",
            onDelete: "NO ACTION",
          }),
          new TableForeignKey({
            columnNames: ["workspace_id"],
            referencedColumnNames: ["id"],
            referencedTableName: "workspaces",
            onDelete: "CASCADE",
          })
        ]
      );

      const fieldsToIndex = [
        // ["id"]
        ["uuid"],
        ["journey_id"],
      ];

      const indexes: TableIndex[] = fieldsToIndex.map(fields => {
        const names = fields.join("_");
        const allFields = ["workspace_id", ...fields];

        return new TableIndex({
          name: `idx_journey_version_${names}`,
          columnNames: allFields
        });
      });

      await queryRunner.createIndices(
        "journey_versions",
        [
          ...indexes,
          new TableIndex({
            name: `idx_journey_version_number`,
            columnNames: ["workspace_id", "journey_id", "number"],
            isUnique: true,
          })
        ]
      );
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
    }

}
