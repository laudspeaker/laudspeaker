import { MigrationInterface, QueryRunner } from 'typeorm';

export class JourneyEnrollment1709061978706 implements MigrationInterface {
  name = 'JourneyEnrollment1709061978706';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "journey" ADD "enrollment_count" bigint NOT NULL DEFAULT '0'`
    );
    await queryRunner.query(
      `ALTER TABLE "journey" ADD "last_enrollment_timestamp" bigint`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "journey" DROP COLUMN "last_enrollment_timestamp"`
    );
    await queryRunner.query(
      `ALTER TABLE "journey" DROP COLUMN "enrollment_count"`
    );
  }
}
