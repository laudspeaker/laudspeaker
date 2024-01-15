import { MigrationInterface, QueryRunner } from 'typeorm';

export class IntegrationWorkspaceId1704190103860 implements MigrationInterface {
  name = 'IntegrationWorkspaceId1704190103860';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "requeue" DROP CONSTRAINT "FK_9177681f9f569d2d51ce9607aa0"`
    );
    await queryRunner.query(
      `ALTER TABLE "requeue" DROP CONSTRAINT "PK_289cdd885e77924090659937bdf"`
    );
    await queryRunner.query(
      `ALTER TABLE "requeue" ADD CONSTRAINT "PK_aafa069b0da08f2e861079bc7a2" PRIMARY KEY ("stepId", "workspaceId", "customerId")`
    );
    await queryRunner.query(`ALTER TABLE "requeue" DROP COLUMN "ownerId"`);
    await queryRunner.query(`ALTER TABLE "integration" ADD "workspaceId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "integration" ADD CONSTRAINT "FK_a39552de8fedd4562a1c2d44bde" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );

    await queryRunner.query(`
        UPDATE "integration" intg
        SET "workspaceId" = (
            SELECT ws."id"
            FROM "workspaces" ws
            INNER JOIN "organization" org ON org."id" = ws."organizationId"
            WHERE org."ownerId" = intg."ownerId"
            LIMIT 1
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "integration" DROP CONSTRAINT "FK_a39552de8fedd4562a1c2d44bde"`
    );
    await queryRunner.query(
      `ALTER TABLE "integration" DROP COLUMN "workspaceId"`
    );
    await queryRunner.query(
      `ALTER TABLE "requeue" ADD "ownerId" uuid NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "requeue" DROP CONSTRAINT "PK_aafa069b0da08f2e861079bc7a2"`
    );
    await queryRunner.query(
      `ALTER TABLE "requeue" ADD CONSTRAINT "PK_289cdd885e77924090659937bdf" PRIMARY KEY ("ownerId", "stepId", "workspaceId", "customerId")`
    );
    await queryRunner.query(
      `ALTER TABLE "requeue" ADD CONSTRAINT "FK_9177681f9f569d2d51ce9607aa0" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }
}
