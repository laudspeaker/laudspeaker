import { MigrationInterface, QueryRunner } from 'typeorm';

export class OneToManySegment1671011800583 implements MigrationInterface {
  name = 'OneToManySegment1671011800583';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workflow" DROP CONSTRAINT "FK_87763c043e247cf8b9dec68beae"`
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" RENAME COLUMN "segmentId" TO "attachedSegmentId"`
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" ADD CONSTRAINT "FK_72a499a6f67ce7a146de4f81ac5" FOREIGN KEY ("attachedSegmentId") REFERENCES "segment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workflow" DROP CONSTRAINT "FK_72a499a6f67ce7a146de4f81ac5"`
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" RENAME COLUMN "attachedSegmentId" TO "segmentId"`
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" ADD CONSTRAINT "FK_87763c043e247cf8b9dec68beae" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
