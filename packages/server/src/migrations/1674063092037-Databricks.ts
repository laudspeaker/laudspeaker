import { MigrationInterface, QueryRunner } from "typeorm";

export class Databricks1674063092037 implements MigrationInterface {
    name = 'Databricks1674063092037'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "database" ADD "databricksHost" character varying`);
        await queryRunner.query(`ALTER TABLE "database" ADD "databricksPath" character varying`);
        await queryRunner.query(`ALTER TABLE "database" ADD "databricksToken" character varying`);
        await queryRunner.query(`ALTER TABLE "integration" ALTER COLUMN "description" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "integration" ALTER COLUMN "description" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "database" DROP COLUMN "databricksToken"`);
        await queryRunner.query(`ALTER TABLE "database" DROP COLUMN "databricksPath"`);
        await queryRunner.query(`ALTER TABLE "database" DROP COLUMN "databricksHost"`);
    }

}
