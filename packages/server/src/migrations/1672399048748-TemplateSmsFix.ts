import { MigrationInterface, QueryRunner } from "typeorm";

export class TemplateSmsFix1672399048748 implements MigrationInterface {
    name = 'TemplateSmsFix1672399048748'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "template" ADD "smsText" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "template" DROP COLUMN "smsText"`);
    }

}
