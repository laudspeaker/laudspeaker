import {
  MigrationInterface,
  QueryRunner,
  TableForeignKey,
  TableIndex,
  TableColumn,
  Table,
} from "typeorm"

export class UpdateJourneyForVersioning1737586932509 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns(
        "journey",
        [
          new TableColumn({
            name: "uuid",
            type: "UUID",
            default: "uuid_generate_v7()"
          }),
        ]
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }

}
