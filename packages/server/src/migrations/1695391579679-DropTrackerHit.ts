import { MigrationInterface, QueryRunner } from 'typeorm';

export class DropTrackerHit1695391579679 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE IF EXISTS "tracker_hit"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}

