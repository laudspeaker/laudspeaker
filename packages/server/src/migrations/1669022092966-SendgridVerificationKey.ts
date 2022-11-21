import { MigrationInterface, QueryRunner } from "typeorm";

export class SendgridVerificationKey1669022092966 implements MigrationInterface {
    name = 'SendgridVerificationKey1669022092966'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account" ADD "sendgridVerificationKey" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "sendgridVerificationKey"`);
    }

}
