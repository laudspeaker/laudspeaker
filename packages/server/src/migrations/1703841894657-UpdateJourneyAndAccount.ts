import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateJourneyAndAccount1703841894657
  implements MigrationInterface
{
  name = 'UpdateJourneyAndAccount1703841894657';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "customerId"`);
    await queryRunner.query(`ALTER TABLE "journey" ADD "workspaceId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "journey" ADD CONSTRAINT "FK_478516b0bc589a97d1bd75c7267" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );

    await queryRunner.query(`
    UPDATE "journey" j
    SET "workspaceId" = (
        SELECT ws."id"
        FROM "workspaces" ws
        INNER JOIN "organization" o ON o."id" = ws."organizationId"
        WHERE o."ownerId" = j."ownerId"
        LIMIT 1
    )`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "journey" DROP CONSTRAINT "FK_478516b0bc589a97d1bd75c7267"`
    );
    await queryRunner.query(`ALTER TABLE "journey" DROP COLUMN "workspaceId"`);
    await queryRunner.query(
      `ALTER TABLE "account" ADD "customerId" character varying`
    );
  }
}
