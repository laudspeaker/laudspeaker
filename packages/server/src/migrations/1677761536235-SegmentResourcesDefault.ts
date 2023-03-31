import { MigrationInterface, QueryRunner } from 'typeorm';

export class SegmentResourcesDefault1677761536235
  implements MigrationInterface
{
  name = 'SegmentResourcesDefault1677761536235';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "segment" ALTER COLUMN "resources" SET DEFAULT '{}'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "segment" ALTER COLUMN "resources" DROP DEFAULT`
    );
  }
}
