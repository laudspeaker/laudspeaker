import { MigrationInterface, QueryRunner } from 'typeorm';

export class WorkspaceIdForStep1703856357690 implements MigrationInterface {
  name = 'WorkspaceIdForStep1703856357690';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "step" ADD "workspaceId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "step" ADD CONSTRAINT "FK_b1f514b4284a1939aae899fa0a1" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );

    await queryRunner.query(`
            UPDATE "step" s
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
      `ALTER TABLE "step" DROP CONSTRAINT "FK_b1f514b4284a1939aae899fa0a1"`
    );
    await queryRunner.query(`ALTER TABLE "step" DROP COLUMN "workspaceId"`);
  }
}
