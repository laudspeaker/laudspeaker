import { MigrationInterface, QueryRunner } from 'typeorm';

export class JourneyLocationWorkspaceId1704213382337
  implements MigrationInterface
{
  name = 'JourneyLocationWorkspaceId1704213382337';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "journey_location" ADD "workspaceId" uuid`
    );
    await queryRunner.query(
      `ALTER TABLE "journey_location" ADD CONSTRAINT "FK_7b9b00e04d8238e4f7139f04fe3" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );

    await queryRunner.query(`
        UPDATE "journey_location" jl
        SET "workspaceId" = (
            SELECT ws."id"
            FROM "workspaces" ws
            INNER JOIN "organization" org ON org."id" = ws."organizationId"
            WHERE org."ownerId" = jl."ownerId"
            LIMIT 1
        )
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "journey_location" DROP CONSTRAINT "FK_7b9b00e04d8238e4f7139f04fe3"`
    );
    await queryRunner.query(
      `ALTER TABLE "journey_location" DROP COLUMN "workspaceId"`
    );
  }
}

