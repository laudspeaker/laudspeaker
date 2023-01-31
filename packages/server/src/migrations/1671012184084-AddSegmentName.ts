import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddSegmentName1671012184084 implements MigrationInterface {
  name = 'AddSegmentName1671012184084';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "segment" ADD "name" character varying NOT NULL`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "segment" DROP COLUMN "name"`);
  }
}
