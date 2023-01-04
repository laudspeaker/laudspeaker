import { MigrationInterface, QueryRunner } from "typeorm";

export class ManyToManyTemplates1672838179732 implements MigrationInterface {
    name = 'ManyToManyTemplates1672838179732'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "template" DROP CONSTRAINT "FK_596a6f2d1cc630a8eaba66d028f"`);
        await queryRunner.query(`CREATE TABLE "audience_templates_template" ("audienceId" uuid NOT NULL, "templateId" integer NOT NULL, CONSTRAINT "PK_719bc93f94130cad7a94fc43543" PRIMARY KEY ("audienceId", "templateId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_eda840574aa035b9c18042e2cd" ON "audience_templates_template" ("audienceId") `);
        await queryRunner.query(`CREATE INDEX "IDX_c86b558dc1e70466712e775884" ON "audience_templates_template" ("templateId") `);
        await queryRunner.query(`ALTER TABLE "template" DROP COLUMN "audienceId"`);
        await queryRunner.query(`ALTER TABLE "audience_templates_template" ADD CONSTRAINT "FK_eda840574aa035b9c18042e2cda" FOREIGN KEY ("audienceId") REFERENCES "audience"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "audience_templates_template" ADD CONSTRAINT "FK_c86b558dc1e70466712e7758847" FOREIGN KEY ("templateId") REFERENCES "template"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audience_templates_template" DROP CONSTRAINT "FK_c86b558dc1e70466712e7758847"`);
        await queryRunner.query(`ALTER TABLE "audience_templates_template" DROP CONSTRAINT "FK_eda840574aa035b9c18042e2cda"`);
        await queryRunner.query(`ALTER TABLE "template" ADD "audienceId" uuid`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c86b558dc1e70466712e775884"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_eda840574aa035b9c18042e2cd"`);
        await queryRunner.query(`DROP TABLE "audience_templates_template"`);
        await queryRunner.query(`ALTER TABLE "template" ADD CONSTRAINT "FK_596a6f2d1cc630a8eaba66d028f" FOREIGN KEY ("audienceId") REFERENCES "audience"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
