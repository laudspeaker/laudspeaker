import { MigrationInterface, QueryRunner } from 'typeorm';

export class AudienceRelationNullableConstraint1672841615582
  implements MigrationInterface
{
  name = 'AudienceRelationNullableConstraint1672841615582';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audience" DROP CONSTRAINT "FK_a43726b73bcefa3e4ff39cb43a8"`
    );
    await queryRunner.query(
      `ALTER TABLE "audience" ALTER COLUMN "workflowId" SET NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "audience" ADD CONSTRAINT "FK_a43726b73bcefa3e4ff39cb43a8" FOREIGN KEY ("workflowId") REFERENCES "workflow"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "audience" DROP CONSTRAINT "FK_a43726b73bcefa3e4ff39cb43a8"`
    );
    await queryRunner.query(
      `ALTER TABLE "audience" ALTER COLUMN "workflowId" DROP NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "audience" ADD CONSTRAINT "FK_a43726b73bcefa3e4ff39cb43a8" FOREIGN KEY ("workflowId") REFERENCES "workflow"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }
}
