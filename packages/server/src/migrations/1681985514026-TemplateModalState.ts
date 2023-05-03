import { MigrationInterface, QueryRunner } from 'typeorm';

export class TemplateModalState1681985514026 implements MigrationInterface {
  name = 'TemplateModalState1681985514026';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "template" ADD "modalState" jsonb`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "template" DROP COLUMN "modalState"`);
  }
}
