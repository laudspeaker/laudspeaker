import { MigrationInterface, QueryRunner } from 'typeorm';

export class NewSegmentType1677667682839 implements MigrationInterface {
  name = 'NewSegmentType1677667682839';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "filter" DROP CONSTRAINT "FK_efe7ce4e85c90aba0882bde0f46"`
    );
    await queryRunner.query(
      `ALTER TABLE "segment" DROP CONSTRAINT "FK_6382527b5e71486a37ec938662c"`
    );
    await queryRunner.query(
      `ALTER TABLE "segment" ADD "type" character varying NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "segment" ADD "inclusionCriteria" jsonb NOT NULL DEFAULT '{"conditionalType":"and","conditions":[]}'`
    );
    await queryRunner.query(
      `ALTER TABLE "segment" ADD "isFreezed" boolean NOT NULL DEFAULT true`
    );
    await queryRunner.query(
      `ALTER TABLE "segment" ADD "resources" jsonb NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "filter" ALTER COLUMN "isFreezed" SET DEFAULT true`
    );
    await queryRunner.query(
      `ALTER TABLE "segment" ALTER COLUMN "userId" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "filter" ADD CONSTRAINT "FK_6382527b5e71486a37ec938662c" FOREIGN KEY ("userId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "segment" ADD CONSTRAINT "FK_efe7ce4e85c90aba0882bde0f46" FOREIGN KEY ("userId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "segment" DROP CONSTRAINT "FK_efe7ce4e85c90aba0882bde0f46"`
    );
    await queryRunner.query(
      `ALTER TABLE "filter" DROP CONSTRAINT "FK_6382527b5e71486a37ec938662c"`
    );
    await queryRunner.query(
      `ALTER TABLE "segment" ALTER COLUMN "userId" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "filter" ALTER COLUMN "isFreezed" SET DEFAULT false`
    );
    await queryRunner.query(`ALTER TABLE "segment" DROP COLUMN "resources"`);
    await queryRunner.query(`ALTER TABLE "segment" DROP COLUMN "isFreezed"`);
    await queryRunner.query(
      `ALTER TABLE "segment" DROP COLUMN "inclusionCriteria"`
    );
    await queryRunner.query(`ALTER TABLE "segment" DROP COLUMN "type"`);
    await queryRunner.query(
      `ALTER TABLE "segment" ADD CONSTRAINT "FK_6382527b5e71486a37ec938662c" FOREIGN KEY ("userId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "filter" ADD CONSTRAINT "FK_efe7ce4e85c90aba0882bde0f46" FOREIGN KEY ("userId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }
}
