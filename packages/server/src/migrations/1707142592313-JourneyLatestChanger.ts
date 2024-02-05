import { MigrationInterface, QueryRunner } from 'typeorm';

export class JourneyLatestChanger1707142592313 implements MigrationInterface {
  name = 'JourneyLatestChanger1707142592313';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "journey" ADD "latestChangerId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "journey" ADD CONSTRAINT "FK_fa4263c304cab744acc321a391b" FOREIGN KEY ("latestChangerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "journey" DROP CONSTRAINT "FK_fa4263c304cab744acc321a391b"`
    );
    await queryRunner.query(
      `ALTER TABLE "journey" DROP COLUMN "latestChangerId"`
    );
  }
}
