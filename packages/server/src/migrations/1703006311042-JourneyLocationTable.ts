import { MigrationInterface, QueryRunner } from 'typeorm';

export class JourneyLocationTable1703006311042 implements MigrationInterface {
  name = 'JourneyLocationTable1703006311042';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "journey_location" ("journeyId" uuid NOT NULL, "customer" character varying NOT NULL, "stepEntry" bigint NOT NULL, "moveStarted" bigint, "stepId" uuid, "ownerId" uuid, CONSTRAINT "PK_2184442420ee498a92f3bab1b1f" PRIMARY KEY ("journeyId", "customer"))`
    );
    await queryRunner.query(
      `ALTER TABLE "journey_location" ADD CONSTRAINT "FK_601eb8f16a433436338373167dc" FOREIGN KEY ("journeyId") REFERENCES "journey"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "journey_location" ADD CONSTRAINT "FK_5a674a171525bdba040d0896f1b" FOREIGN KEY ("stepId") REFERENCES "step"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "journey_location" ADD CONSTRAINT "FK_0d56cd50938957295bff8999dcf" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "journey_location" DROP CONSTRAINT "FK_0d56cd50938957295bff8999dcf"`
    );
    await queryRunner.query(
      `ALTER TABLE "journey_location" DROP CONSTRAINT "FK_5a674a171525bdba040d0896f1b"`
    );
    await queryRunner.query(
      `ALTER TABLE "journey_location" DROP CONSTRAINT "FK_601eb8f16a433436338373167dc"`
    );
    await queryRunner.query(`DROP TABLE "journey_location"`);
  }
}
