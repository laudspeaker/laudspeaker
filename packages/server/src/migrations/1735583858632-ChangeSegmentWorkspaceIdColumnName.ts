import {
	MigrationInterface,
	QueryRunner,
	TableIndex
} from "typeorm"

export class ChangeSegmentWorkspaceIdColumnName1735583858632 implements MigrationInterface {

	public async up(queryRunner: QueryRunner): Promise<void> {
		await queryRunner.renameColumn(
			"segment",
			"workspaceId",
			"workspace_id"
		);

		await queryRunner.createIndex(
			"segment",
			new TableIndex({
			  name: "idx_segment_workspace_id",
			  columnNames: ["workspace_id"]
			})
		);
	}

	public async down(queryRunner: QueryRunner): Promise<void> {
	}

}
