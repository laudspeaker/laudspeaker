import { MigrationInterface, QueryRunner } from 'typeorm';

export class TrackerTemplate1690283885561 implements MigrationInterface {
  name = 'TrackerTemplate1690283885561';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "template" ADD "customEvents" text array NOT NULL DEFAULT '{}'`
    );
    await queryRunner.query(`ALTER TABLE "template" ADD "customFields" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "template" DROP COLUMN "customFields"`
    );
    await queryRunner.query(
      `ALTER TABLE "template" DROP COLUMN "customEvents"`
    );
  }
}
