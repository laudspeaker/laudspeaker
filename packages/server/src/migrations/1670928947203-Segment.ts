import { MigrationInterface, QueryRunner } from 'typeorm';

export class Segment1670928947203 implements MigrationInterface {
  name = 'Segment1670928947203';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "segment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "inclusionCriteria" jsonb NOT NULL DEFAULT '{"conditionalType":"and","conditions":[]}', "isFreezed" boolean NOT NULL DEFAULT false, CONSTRAINT "PK_d648ac58d8e0532689dfb8ad7ef" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`ALTER TABLE "audience" DROP COLUMN "isDynamic"`);
    await queryRunner.query(
      `ALTER TABLE "audience" DROP COLUMN "inclusionCriteria"`
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" ADD "isDynamic" boolean NOT NULL DEFAULT true`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "workflow" DROP COLUMN "isDynamic"`);
    await queryRunner.query(
      `ALTER TABLE "audience" ADD "inclusionCriteria" jsonb NOT NULL DEFAULT '{"conditions": [], "conditionalType": "and"}'`
    );
    await queryRunner.query(
      `ALTER TABLE "audience" ADD "isDynamic" boolean NOT NULL DEFAULT true`
    );
    await queryRunner.query(`DROP TABLE "segment"`);
  }
}
