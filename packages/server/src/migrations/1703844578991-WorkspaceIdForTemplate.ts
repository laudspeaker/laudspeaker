import { MigrationInterface, QueryRunner } from 'typeorm';

export class WorkspaceIdForTemplate1703844578991 implements MigrationInterface {
  name = 'WorkspaceIdForTemplate1703844578991';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "template" ADD "workspaceId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "template" ADD CONSTRAINT "FK_1ed8fa4dc1ce613fef91c767931" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );

    await queryRunner.query(`
        UPDATE "template" t
        SET "workspaceId" = (
            SELECT ws."id"
            FROM "workspaces" ws
            INNER JOIN "organization" org ON org."id" = ws."organizationId"
            WHERE org."ownerId" = t."ownerId"
            LIMIT 1
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "template" DROP CONSTRAINT "FK_1ed8fa4dc1ce613fef91c767931"`
    );
    await queryRunner.query(`ALTER TABLE "template" DROP COLUMN "workspaceId"`);
  }
}
