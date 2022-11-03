import { MigrationInterface, QueryRunner } from "typeorm";

export class AccountCreationTimestampBillingPlanMessagesSent1667437106382 implements MigrationInterface {
    name = 'AccountCreationTimestampBillingPlanMessagesSent1667437106382'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account" ADD "accountCreatedAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "account" ADD "messagesSent" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`CREATE TYPE "public"."account_plan_enum" AS ENUM('free', 'paid', 'enterprise')`);
        await queryRunner.query(`ALTER TABLE "account" ADD "plan" "public"."account_plan_enum" NOT NULL DEFAULT 'free'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "plan"`);
        await queryRunner.query(`DROP TYPE "public"."account_plan_enum"`);
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "messagesSent"`);
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "accountCreatedAt"`);
    }

}
