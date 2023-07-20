import { MigrationInterface, QueryRunner } from 'typeorm';

export class PosthogAndSnippetSetupFlags1689765495518
  implements MigrationInterface
{
  name = 'PosthogAndSnippetSetupFlags1689765495518';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "account" ADD "posthogSetupped" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD "javascriptSnippetSetupped" boolean NOT NULL DEFAULT false`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "account" DROP COLUMN "javascriptSnippetSetupped"`
    );
    await queryRunner.query(
      `ALTER TABLE "account" DROP COLUMN "posthogSetupped"`
    );
  }
}
