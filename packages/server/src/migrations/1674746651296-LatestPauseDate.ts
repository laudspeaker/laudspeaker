import { MigrationInterface, QueryRunner } from "typeorm";

export class LatestPauseDate1674746651296 implements MigrationInterface {
    name = 'LatestPauseDate1674746651296'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workflow" ADD "latestPause" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workflow" DROP COLUMN "latestPause"`);
    }

}
