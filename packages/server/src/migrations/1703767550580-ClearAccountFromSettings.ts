import { MigrationInterface, QueryRunner } from "typeorm";

export class ClearAccountFromSettings1703767550580 implements MigrationInterface {
    name = 'ClearAccountFromSettings1703767550580'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "posthogSetupped"`);
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "javascriptSnippetSetupped"`);
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "pushPlatforms"`);
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "sendgridApiKey"`);
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "sendgridFromEmail"`);
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "sendgridVerificationKey"`);
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "smsAccountSid"`);
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "smsAuthToken"`);
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "smsFrom"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account" ADD "smsFrom" character varying`);
        await queryRunner.query(`ALTER TABLE "account" ADD "smsAuthToken" character varying`);
        await queryRunner.query(`ALTER TABLE "account" ADD "smsAccountSid" character varying`);
        await queryRunner.query(`ALTER TABLE "account" ADD "sendgridVerificationKey" character varying`);
        await queryRunner.query(`ALTER TABLE "account" ADD "sendgridFromEmail" character varying`);
        await queryRunner.query(`ALTER TABLE "account" ADD "sendgridApiKey" character varying`);
        await queryRunner.query(`ALTER TABLE "account" ADD "pushPlatforms" jsonb NOT NULL DEFAULT '{}'`);
        await queryRunner.query(`ALTER TABLE "account" ADD "javascriptSnippetSetupped" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "account" ADD "posthogSetupped" boolean NOT NULL DEFAULT false`);
    }

}
