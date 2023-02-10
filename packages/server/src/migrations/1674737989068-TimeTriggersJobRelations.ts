import { MigrationInterface, QueryRunner } from 'typeorm';

export class TimeTriggersJobRelations1674737989068
  implements MigrationInterface
{
  name = 'TimeTriggersJobRelations1674737989068';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "from"`);
    await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "to"`);
    await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "workflow"`);
    await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "owner"`);
    await queryRunner.query(`ALTER TABLE "job" ADD "ownerId" integer`);
    await queryRunner.query(`ALTER TABLE "job" ADD "fromId" uuid`);
    await queryRunner.query(`ALTER TABLE "job" ADD "toId" uuid`);
    await queryRunner.query(`ALTER TABLE "job" ADD "workflowId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "job" ADD CONSTRAINT "FK_4230d15401eafcf6f4538208015" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "job" ADD CONSTRAINT "FK_b8c4ac933e56a54c26cf3888218" FOREIGN KEY ("fromId") REFERENCES "audience"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "job" ADD CONSTRAINT "FK_d56433457b0eb16be2f9ddd808d" FOREIGN KEY ("toId") REFERENCES "audience"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "job" ADD CONSTRAINT "FK_4c192400b23eac7939d0217d0ce" FOREIGN KEY ("workflowId") REFERENCES "workflow"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "job" DROP CONSTRAINT "FK_4c192400b23eac7939d0217d0ce"`
    );
    await queryRunner.query(
      `ALTER TABLE "job" DROP CONSTRAINT "FK_d56433457b0eb16be2f9ddd808d"`
    );
    await queryRunner.query(
      `ALTER TABLE "job" DROP CONSTRAINT "FK_b8c4ac933e56a54c26cf3888218"`
    );
    await queryRunner.query(
      `ALTER TABLE "job" DROP CONSTRAINT "FK_4230d15401eafcf6f4538208015"`
    );
    await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "workflowId"`);
    await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "toId"`);
    await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "fromId"`);
    await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "ownerId"`);
    await queryRunner.query(
      `ALTER TABLE "job" ADD "owner" character varying NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "job" ADD "workflow" character varying NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "job" ADD "to" character varying NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "job" ADD "from" character varying NOT NULL`
    );
  }
}
