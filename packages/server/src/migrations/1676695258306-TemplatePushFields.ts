import { MigrationInterface, QueryRunner } from "typeorm";

export class TemplatePushFields1676695258306 implements MigrationInterface {
    name = 'TemplatePushFields1676695258306'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "template" ADD "pushText" character varying`);
        await queryRunner.query(`ALTER TABLE "template" ADD "pushTitle" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "template" DROP COLUMN "pushTitle"`);
        await queryRunner.query(`ALTER TABLE "template" DROP COLUMN "pushText"`);
    }

}
