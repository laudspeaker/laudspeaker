import { MigrationInterface, QueryRunner } from 'typeorm';

export class SegmentUserId1670943083717 implements MigrationInterface {
  name = 'SegmentUserId1670943083717';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "segment" ADD "userId" character varying NOT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "segment" DROP COLUMN "userId"`);
  }
}
