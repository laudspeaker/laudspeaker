import { MigrationInterface, QueryRunner } from "typeorm";

export class IntegrationStatus1674471121631 implements MigrationInterface {
    name = 'IntegrationStatus1674471121631'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "integration" ADD "status" character varying NOT NULL DEFAULT 'active'`);
        await queryRunner.query(`ALTER TABLE "integration" ADD "errorMessage" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "integration" DROP COLUMN "errorMessage"`);
        await queryRunner.query(`ALTER TABLE "integration" DROP COLUMN "status"`);
    }

}
