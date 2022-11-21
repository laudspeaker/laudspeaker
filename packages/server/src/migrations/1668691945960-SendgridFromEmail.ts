import { MigrationInterface, QueryRunner } from "typeorm";

export class SendgridFromEmail1668691945960 implements MigrationInterface {
    name = 'SendgridFromEmail1668691945960'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account" ADD "sendgridFromEmail" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "sendgridFromEmail"`);
    }

}
