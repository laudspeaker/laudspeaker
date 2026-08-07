import { MigrationInterface, QueryRunner } from "typeorm";

export class CleanupJobsAndSteps1724884673014 implements MigrationInterface {
    name = 'CleanupJobsAndSteps1724884673014'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job" DROP CONSTRAINT "FK_4c192400b23eac7939d0217d0ce"`);
        await queryRunner.query(`ALTER TABLE "job" DROP CONSTRAINT "FK_d56433457b0eb16be2f9ddd808d"`);
        await queryRunner.query(`ALTER TABLE "job" DROP CONSTRAINT "FK_b8c4ac933e56a54c26cf3888218"`);
        await queryRunner.query(`ALTER TABLE "step" DROP COLUMN "customers"`);
        await queryRunner.query(`ALTER TABLE "step" DROP CONSTRAINT "FK_b1f514b4284a1939aae899fa0a1"`);
        await queryRunner.query(`ALTER TABLE "step" ALTER COLUMN "workspaceId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "step" ADD CONSTRAINT "FK_b1f514b4284a1939aae899fa0a1" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job" ADD CONSTRAINT "FK_b8c4ac933e56a54c26cf3888218" FOREIGN KEY ("fromId") REFERENCES "step"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job" ADD CONSTRAINT "FK_d56433457b0eb16be2f9ddd808d" FOREIGN KEY ("toId") REFERENCES "step"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job" ADD CONSTRAINT "FK_4c192400b23eac7939d0217d0ce" FOREIGN KEY ("workflowId") REFERENCES "journey"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job" DROP CONSTRAINT "FK_4c192400b23eac7939d0217d0ce"`);
        await queryRunner.query(`ALTER TABLE "job" DROP CONSTRAINT "FK_d56433457b0eb16be2f9ddd808d"`);
        await queryRunner.query(`ALTER TABLE "job" DROP CONSTRAINT "FK_b8c4ac933e56a54c26cf3888218"`);
        await queryRunner.query(`ALTER TABLE "step" DROP CONSTRAINT "FK_b1f514b4284a1939aae899fa0a1"`);
        await queryRunner.query(`ALTER TABLE "step" ALTER COLUMN "workspaceId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "step" ADD CONSTRAINT "FK_b1f514b4284a1939aae899fa0a1" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "step" ADD "customers" text array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "job" ADD CONSTRAINT "FK_b8c4ac933e56a54c26cf3888218" FOREIGN KEY ("fromId") REFERENCES "audience"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job" ADD CONSTRAINT "FK_d56433457b0eb16be2f9ddd808d" FOREIGN KEY ("toId") REFERENCES "audience"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "job" ADD CONSTRAINT "FK_4c192400b23eac7939d0217d0ce" FOREIGN KEY ("workflowId") REFERENCES "workflow"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
