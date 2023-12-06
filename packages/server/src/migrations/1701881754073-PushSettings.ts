import { MigrationInterface, QueryRunner } from "typeorm";

export class PushSettings1701881754073 implements MigrationInterface {
    name = 'PushSettings1701881754073'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account" ADD "pushPlatforms" jsonb NOT NULL DEFAULT '{}'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "pushPlatforms"`);
    }

}
