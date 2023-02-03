import { MigrationInterface, QueryRunner } from "typeorm";

export class TemplateIsDeleted1675430314142 implements MigrationInterface {
    name = 'TemplateIsDeleted1675430314142'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "template" ADD "isDeleted" boolean NOT NULL DEFAULT false`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "template" DROP COLUMN "isDeleted"`);
    }

}
