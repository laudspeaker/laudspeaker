import { MigrationInterface, QueryRunner } from 'typeorm';

export class DatabaseLastSyncDefaultFix1675171259749
  implements MigrationInterface
{
  name = 'DatabaseLastSyncDefaultFix1675171259749';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "database" ALTER COLUMN "lastSync" SET DEFAULT 'Thu, 01 Jan 1970 00:00:00 GMT'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "database" ALTER COLUMN "lastSync" SET DEFAULT 'Tue, 31 Jan 2023 11:52:03 GMT'`
    );
  }
}
