import { MigrationInterface, QueryRunner } from 'typeorm';

export class NewJourneySegmentFix1686217349743 implements MigrationInterface {
  name = 'NewJourneySegmentFix1686217349743';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "journey" ALTER COLUMN "inclusionCriteria" SET DEFAULT '{"type":"allCustomers"}'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "journey" ALTER COLUMN "inclusionCriteria" SET DEFAULT '{"conditions": [], "conditionalType": "and"}'`
    );
  }
}
