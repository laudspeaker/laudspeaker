import { MigrationInterface, QueryRunner } from "typeorm";

export class TestEmails1668420856230 implements MigrationInterface {
    name = 'TestEmails1668420856230'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account" ADD "emailProvider" character varying`);
        await queryRunner.query(`ALTER TABLE "account" ADD "testSendingEmail" character varying`);
        await queryRunner.query(`ALTER TABLE "account" ADD "testSendingName" character varying`);
        await queryRunner.query(`ALTER TABLE "account" ADD "freeEmailsCount" integer NOT NULL DEFAULT '3'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "freeEmailsCount"`);
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "testSendingName"`);
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "testSendingEmail"`);
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "emailProvider"`);
    }

}
