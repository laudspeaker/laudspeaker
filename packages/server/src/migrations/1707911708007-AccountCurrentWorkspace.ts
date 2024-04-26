import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountCurrentWorkspace1707911708007
  implements MigrationInterface
{
  name = 'AccountCurrentWorkspace1707911708007';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "account" ADD "currentWorkspaceId" uuid`
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD CONSTRAINT "FK_f023edd630150d9e2fbd7bdf9a1" FOREIGN KEY ("currentWorkspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "account" DROP CONSTRAINT "FK_f023edd630150d9e2fbd7bdf9a1"`
    );
    await queryRunner.query(
      `ALTER TABLE "account" DROP COLUMN "currentWorkspaceId"`
    );
  }
}
