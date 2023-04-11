import { MigrationInterface, QueryRunner } from 'typeorm';

export class CCField1680536628883 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "template" ADD "cc" text array NOT NULL DEFAULT '{}'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "template" DROP COLUMN "cc"`);
  }
}
