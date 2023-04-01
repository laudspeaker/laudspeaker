import { MigrationInterface, QueryRunner } from 'typeorm';

export class SegmentDefaultResourceFix1677846178425
  implements MigrationInterface
{
  name = 'SegmentDefaultResourceFix1677846178425';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "segment" ALTER COLUMN "resources" SET DEFAULT '{"conditions":{"id":"conditions","type":"select","label":"filter on","options":[{"label":"select","id":"","isPlaceholder":true},{"label":"Attributes","id":"attributes"}]}}'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "segment" ALTER COLUMN "resources" SET DEFAULT '{}'`
    );
  }
}
