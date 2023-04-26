import { MigrationInterface, QueryRunner } from 'typeorm';

export class WorkflowStartedAt1681295761871 implements MigrationInterface {
  name = 'WorkflowStartedAt1681295761871';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "workflow" ADD "startedAt" TIMESTAMP`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "workflow" DROP COLUMN "startedAt"`);
  }
}
