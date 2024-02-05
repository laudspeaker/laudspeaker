import { MigrationInterface, QueryRunner } from 'typeorm';

export class JourneyChange1706875540578 implements MigrationInterface {
  name = 'JourneyChange1706875540578';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "journey_change" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "changedState" jsonb NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "journeyId" uuid NOT NULL, "changerId" uuid NOT NULL, "previousChangeId" uuid, CONSTRAINT "REL_6759dbed9c3b16df396937ba76" UNIQUE ("previousChangeId"), CONSTRAINT "PK_cb32662c9d1ccc46ab0720976c9" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "journey_change" ADD CONSTRAINT "FK_1adae523260b6321e777b30c99c" FOREIGN KEY ("journeyId") REFERENCES "journey"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "journey_change" ADD CONSTRAINT "FK_2a061275237066abab09fb8fd1c" FOREIGN KEY ("changerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "journey_change" ADD CONSTRAINT "FK_6759dbed9c3b16df396937ba761" FOREIGN KEY ("previousChangeId") REFERENCES "journey_change"("id") ON DELETE NO ACTION ON UPDATE CASCADE`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "journey_change" DROP CONSTRAINT "FK_6759dbed9c3b16df396937ba761"`
    );
    await queryRunner.query(
      `ALTER TABLE "journey_change" DROP CONSTRAINT "FK_2a061275237066abab09fb8fd1c"`
    );
    await queryRunner.query(
      `ALTER TABLE "journey_change" DROP CONSTRAINT "FK_1adae523260b6321e777b30c99c"`
    );
    await queryRunner.query(`DROP TABLE "journey_change"`);
  }
}
