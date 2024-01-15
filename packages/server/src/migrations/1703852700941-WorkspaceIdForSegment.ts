import { MigrationInterface, QueryRunner } from 'typeorm';

export class WorkspaceIdForSegment1703852700941 implements MigrationInterface {
  name = 'WorkspaceIdForSegment1703852700941';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "segment" ADD "workspaceId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "segment" ADD CONSTRAINT "FK_8cc5436f7b5d48f5d4ad4e9cd6f" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );

    await queryRunner.query(`
            UPDATE "segment" s
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
      `ALTER TABLE "segment" DROP CONSTRAINT "FK_8cc5436f7b5d48f5d4ad4e9cd6f"`
    );
    await queryRunner.query(`ALTER TABLE "segment" DROP COLUMN "workspaceId"`);
  }
}
