import { MigrationInterface, QueryRunner } from "typeorm";

export class customerId1668177286566 implements MigrationInterface {
    name = 'customerId1668177286566'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account" ADD "customerId" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "customerId"`);
    }

}
