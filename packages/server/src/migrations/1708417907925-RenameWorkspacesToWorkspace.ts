import { MigrationInterface, QueryRunner } from 'typeorm';

export class RenameWorkspacesToWorkspace1708417907925
  implements MigrationInterface
{
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager.query(
      `ALTER TABLE "workspaces" RENAME TO "workspace"`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.manager.query(
      `ALTER TABLE "workspace" RENAME TO "workspaces"`
    );
  }
}
