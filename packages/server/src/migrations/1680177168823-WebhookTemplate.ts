import { MigrationInterface, QueryRunner } from "typeorm";

export class WebhookTemplate1680177168823 implements MigrationInterface {
    name = 'WebhookTemplate1680177168823'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "template" ADD "webhookData" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "template" DROP COLUMN "webhookData"`);
    }

}
