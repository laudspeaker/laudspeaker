import { MigrationInterface, QueryRunner } from 'typeorm';

export class NewSegmentDescription1677668700707 implements MigrationInterface {
  name = 'NewSegmentDescription1677668700707';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "segment" ADD "description" character varying`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "segment" DROP COLUMN "description"`);
  }
}
