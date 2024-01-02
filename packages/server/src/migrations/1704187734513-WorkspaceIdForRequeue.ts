import { MigrationInterface, QueryRunner } from 'typeorm';

export class WorkspaceIdForRequeue1704187734513 implements MigrationInterface {
  name = 'WorkspaceIdForRequeue1704187734513';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "requeue" ADD "workspaceId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "requeue" ADD CONSTRAINT "FK_b0ec93726c20521784a8044705a" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );

    await queryRunner.query(`
        UPDATE "requeue" r
        SET "workspaceId" = (
            SELECT ws."id"
            FROM "workspaces" ws
            INNER JOIN "organization" org ON org."id" = ws."organizationId"
            WHERE org."ownerId" = r."ownerId"
            LIMIT 1
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "requeue" DROP CONSTRAINT "FK_b0ec93726c20521784a8044705a"`
    );
    await queryRunner.query(`ALTER TABLE "requeue" DROP COLUMN "workspaceId"`);
  }
}

