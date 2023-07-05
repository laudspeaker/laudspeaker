import { MigrationInterface, QueryRunner } from 'typeorm';

export class TemplateUpdatedAt1688128729624 implements MigrationInterface {
  name = 'TemplateUpdatedAt1688128729624';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "template" ADD "updatedAt" TIMESTAMP NOT NULL DEFAULT now()`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "template" DROP COLUMN "updatedAt"`);
  }
}
