import { MigrationInterface, QueryRunner } from "typeorm";

export class TimeJobStatus1674752595406 implements MigrationInterface {
    name = 'TimeJobStatus1674752595406'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job" ADD "status" integer NOT NULL DEFAULT '1'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "status"`);
    }

}
