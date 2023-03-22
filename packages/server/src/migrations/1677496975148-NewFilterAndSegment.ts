import { MigrationInterface, QueryRunner } from 'typeorm';

export class NewFilterAndSegment1677496975148 implements MigrationInterface {
  name = 'NewFilterAndSegment1677496975148';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workflow" DROP CONSTRAINT "FK_87763c043e247cf8b9dec68beae"`
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" RENAME COLUMN "segmentId" TO "filterId"`
    );
    await queryRunner.query(`ALTER TABLE "segment" RENAME TO "filter"`);
    await queryRunner.query(`ALTER TABLE "filter" DROP COLUMN "name"`);
    await queryRunner.query(
      `CREATE TABLE "segment" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "userId" uuid NOT NULL, CONSTRAINT "PK_3c5d89c1607d52ce265c7348f70" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "segment_customers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "customerId" character varying NOT NULL, "segmentId" uuid, CONSTRAINT "PK_738b7939074e8674168d2ec5d5e" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "segment" ADD CONSTRAINT "FK_6382527b5e71486a37ec938662c" FOREIGN KEY ("userId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" ADD CONSTRAINT "FK_19b32f64f1780da8c24626cd165" FOREIGN KEY ("filterId") REFERENCES "filter"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "segment_customers" ADD CONSTRAINT "FK_d3c2674d46610072d2d8b91f048" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "segment_customers" DROP CONSTRAINT "FK_d3c2674d46610072d2d8b91f048"`
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" DROP CONSTRAINT "FK_19b32f64f1780da8c24626cd165"`
    );
    await queryRunner.query(
      `ALTER TABLE "segment" DROP CONSTRAINT "FK_6382527b5e71486a37ec938662c"`
    );
    await queryRunner.query(
      `ALTER TABLE "segment" ADD "resources" jsonb NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "segment" ADD "isFreezed" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE "segment" ADD "inclusionCriteria" jsonb NOT NULL DEFAULT '{"conditions": [], "conditionalType": "and"}'`
    );
    await queryRunner.query(`DROP TABLE "segment_customers"`);
    await queryRunner.query(`DROP TABLE "filter"`);
    await queryRunner.query(
      `ALTER TABLE "workflow" RENAME COLUMN "filterId" TO "segmentId"`
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" ADD CONSTRAINT "FK_87763c043e247cf8b9dec68beae" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }
}
