import {
  MigrationInterface,
  QueryRunner,
  TableIndex
} from "typeorm"

export class AddSegmentIndexes1735591306538 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createIndices(
      "segment",
      [
        new TableIndex({
          name: "idx_segment_name",
          columnNames: ["name", "workspace_id"]
        }),
        new TableIndex({
          name: "idx_segment_type",
          columnNames: ["type", "workspace_id"]
        }),
        new TableIndex({
          name: "idx_segment_is_updating",
          columnNames: ["isUpdating", "workspace_id"]
        }),
      ]
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }

}
