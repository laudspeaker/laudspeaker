import { MigrationInterface, QueryRunner } from 'typeorm';

export class NewJourneyVisualLayoutFix1686216638553
  implements MigrationInterface
{
  name = 'NewJourneyVisualLayoutFix1686216638553';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "journey" ALTER COLUMN "visualLayout" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "journey" ALTER COLUMN "visualLayout" SET DEFAULT '{"nodes":[],"edges":[]}'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "journey" ALTER COLUMN "visualLayout" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "journey" ALTER COLUMN "visualLayout" DROP NOT NULL`
    );
  }
}
