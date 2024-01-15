import { MigrationInterface, QueryRunner } from 'typeorm';

export class WorkspaceIdForSegmentCustomers1703861359406
  implements MigrationInterface
{
  name = 'WorkspaceIdForSegmentCustomers1703861359406';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "segment_customers" ADD "workspaceId" uuid`
    );
    await queryRunner.query(
      `ALTER TABLE "segment_customers" ADD CONSTRAINT "FK_c29044bfd7fe0fad5793789e288" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );

    await queryRunner.query(`
        UPDATE "segment_customers" s
        SET "workspaceId" = (
            SELECT ws."id"
            FROM "workspaces" ws
            INNER JOIN "organization" org ON org."id" = ws."organizationId"
            WHERE org."ownerId" = s."ownerId"
            LIMIT 1
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "segment_customers" DROP CONSTRAINT "FK_c29044bfd7fe0fad5793789e288"`
    );
    await queryRunner.query(
      `ALTER TABLE "segment_customers" DROP COLUMN "workspaceId"`
    );
  }
}
