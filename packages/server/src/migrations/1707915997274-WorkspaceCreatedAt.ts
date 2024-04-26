import { MigrationInterface, QueryRunner } from 'typeorm';

export class WorkspaceCreatedAt1707915997274 implements MigrationInterface {
  name = 'WorkspaceCreatedAt1707915997274';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workspaces" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "workspaces" DROP COLUMN "createdAt"`);
  }
}
