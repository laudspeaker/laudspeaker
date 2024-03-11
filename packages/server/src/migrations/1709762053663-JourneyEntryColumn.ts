import { MigrationInterface, QueryRunner } from 'typeorm';

export class JourneyEntryColumn1709762053663 implements MigrationInterface {
  name = 'JourneyEntryColumn1709762053663';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "journey_location" ADD "journeyEntry" bigint NOT NULL DEFAULT '0'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "journey_location" DROP COLUMN "journeyEntry"`
    );
  }
}
