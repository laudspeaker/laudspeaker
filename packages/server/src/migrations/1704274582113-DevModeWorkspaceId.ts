import { MigrationInterface, QueryRunner } from 'typeorm';

export class DevModeWorkspaceId1704274582113 implements MigrationInterface {
  name = 'DevModeWorkspaceId1704274582113';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "dev_mode" ADD "workspaceId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "dev_mode" ADD CONSTRAINT "FK_f890f44290b08bfed2ab4ff625e" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );

    await queryRunner.query(`
        UPDATE "dev_mode" dm
        SET "workspaceId" = (
            SELECT ws."id"
            FROM "workspaces" ws
            INNER JOIN "organization" org ON org."id" = ws."organizationId"
            WHERE org."ownerId" = dm."ownerId"
            LIMIT 1
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dev_mode" DROP CONSTRAINT "FK_f890f44290b08bfed2ab4ff625e"`
    );
    await queryRunner.query(`ALTER TABLE "dev_mode" DROP COLUMN "workspaceId"`);
  }
}

