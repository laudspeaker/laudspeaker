import { MigrationInterface, QueryRunner } from "typeorm";

export class NormalForm1672831067498 implements MigrationInterface {
    name = 'NormalForm1672831067498'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workflow" DROP CONSTRAINT "FK_87763c043e247cf8b9dec68beae"`);
        await queryRunner.query(`ALTER TABLE "webhook_event" DROP CONSTRAINT "FK_1926eaf2385eacb83fa28c928ce"`);
        await queryRunner.query(`ALTER TABLE "audience" RENAME COLUMN "templates" TO "workflowId"`);
        await queryRunner.query(`ALTER TABLE "workflow" DROP COLUMN "audiences"`);
        await queryRunner.query(`ALTER TABLE "template" ADD "audienceId" uuid`);
        await queryRunner.query(`ALTER TABLE "audience" DROP COLUMN "workflowId"`);
        await queryRunner.query(`ALTER TABLE "audience" ADD "workflowId" uuid`);
        await queryRunner.query(`ALTER TABLE "workflow" ADD CONSTRAINT "FK_87763c043e247cf8b9dec68beae" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "audience" ADD CONSTRAINT "FK_a43726b73bcefa3e4ff39cb43a8" FOREIGN KEY ("workflowId") REFERENCES "workflow"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "template" ADD CONSTRAINT "FK_596a6f2d1cc630a8eaba66d028f" FOREIGN KEY ("audienceId") REFERENCES "audience"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "webhook_event" ADD CONSTRAINT "FK_1926eaf2385eacb83fa28c928ce" FOREIGN KEY ("audienceId") REFERENCES "audience"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "webhook_event" DROP CONSTRAINT "FK_1926eaf2385eacb83fa28c928ce"`);
        await queryRunner.query(`ALTER TABLE "template" DROP CONSTRAINT "FK_596a6f2d1cc630a8eaba66d028f"`);
        await queryRunner.query(`ALTER TABLE "audience" DROP CONSTRAINT "FK_a43726b73bcefa3e4ff39cb43a8"`);
        await queryRunner.query(`ALTER TABLE "workflow" DROP CONSTRAINT "FK_87763c043e247cf8b9dec68beae"`);
        await queryRunner.query(`ALTER TABLE "audience" DROP COLUMN "workflowId"`);
        await queryRunner.query(`ALTER TABLE "audience" ADD "workflowId" text array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "template" DROP COLUMN "audienceId"`);
        await queryRunner.query(`ALTER TABLE "workflow" ADD "audiences" text array NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "audience" RENAME COLUMN "workflowId" TO "templates"`);
        await queryRunner.query(`ALTER TABLE "webhook_event" ADD CONSTRAINT "FK_1926eaf2385eacb83fa28c928ce" FOREIGN KEY ("audienceId") REFERENCES "audience"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "workflow" ADD CONSTRAINT "FK_87763c043e247cf8b9dec68beae" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

}
