import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateSegmentSchema1702905786872 implements MigrationInterface {
  name = 'UpdateSegmentSchema1702905786872';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "segment_customers" DROP CONSTRAINT "PK_738b7939074e8674168d2ec5d5e"`
    );
    await queryRunner.query(`ALTER TABLE "segment_customers" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "segment_customers" ADD "ownerId" uuid`
    );
    await queryRunner.query(
      `ALTER TABLE "segment_customers" ADD CONSTRAINT "PK_7ffc372c347886f5c43c6e81115" PRIMARY KEY ("segmentId", "customerId")`
    );
    await queryRunner.query(
      `ALTER TABLE "segment_customers" DROP CONSTRAINT "FK_d3c2674d46610072d2d8b91f048"`
    );
    await queryRunner.query(
      `ALTER TABLE "segment_customers" ALTER COLUMN "segmentId" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "segment_customers" ADD CONSTRAINT "FK_d3c2674d46610072d2d8b91f048" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "segment_customers" ADD CONSTRAINT "FK_9d7b2e0647ac5576473dc820421" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "segment_customers" DROP CONSTRAINT "FK_9d7b2e0647ac5576473dc820421"`
    );
    await queryRunner.query(
      `ALTER TABLE "segment_customers" DROP CONSTRAINT "FK_d3c2674d46610072d2d8b91f048"`
    );
    await queryRunner.query(
      `ALTER TABLE "segment_customers" ALTER COLUMN "segmentId" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "segment_customers" ADD CONSTRAINT "FK_d3c2674d46610072d2d8b91f048" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "segment_customers" DROP CONSTRAINT "PK_7ffc372c347886f5c43c6e81115"`
    );
    await queryRunner.query(
      `ALTER TABLE "segment_customers" DROP COLUMN "ownerId"`
    );
    await queryRunner.query(
      `ALTER TABLE "segment_customers" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`
    );
    await queryRunner.query(
      `ALTER TABLE "segment_customers" ADD CONSTRAINT "PK_738b7939074e8674168d2ec5d5e" PRIMARY KEY ("id")`
    );
  }
}
