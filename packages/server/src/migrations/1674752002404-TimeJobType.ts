import { MigrationInterface, QueryRunner } from "typeorm";

export class TimeJobType1674752002404 implements MigrationInterface {
    name = 'TimeJobType1674752002404'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job" ADD "type" integer NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "type"`);
    }

}
