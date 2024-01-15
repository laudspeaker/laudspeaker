import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveSomeFiledsFromAccount1703765396563
  implements MigrationInterface
{
  name = 'RemoveSomeFiledsFromAccount1703765396563';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "account" DROP CONSTRAINT "UQ_5ffe3d9a0bf0174b51f40eecdc6"`
    );
    await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "messagesSent"`);
    await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "plan"`);
    await queryRunner.query(`DROP TYPE "public"."account_plan_enum"`);
    await queryRunner.query(
      `ALTER TABLE "account" DROP COLUMN "freeEmailsCount"`
    );
    await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "apiKey"`);
    await queryRunner.query(
      `ALTER TABLE "account" DROP COLUMN "mailgunAPIKey"`
    );
    await queryRunner.query(
      `ALTER TABLE "account" DROP COLUMN "sendingDomain"`
    );
    await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "sendingEmail"`);
    await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "sendingName"`);
    await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "slackTeamId"`);
    await queryRunner.query(
      `ALTER TABLE "account" DROP COLUMN "posthogApiKey"`
    );
    await queryRunner.query(
      `ALTER TABLE "account" DROP COLUMN "posthogProjectId"`
    );
    await queryRunner.query(
      `ALTER TABLE "account" DROP COLUMN "posthogHostUrl"`
    );
    await queryRunner.query(
      `ALTER TABLE "account" DROP COLUMN "posthogSmsKey"`
    );
    await queryRunner.query(
      `ALTER TABLE "account" DROP COLUMN "posthogEmailKey"`
    );
    await queryRunner.query(
      `ALTER TABLE "account" DROP COLUMN "emailProvider"`
    );
    await queryRunner.query(
      `ALTER TABLE "account" DROP COLUMN "testSendingEmail"`
    );
    await queryRunner.query(
      `ALTER TABLE "account" DROP COLUMN "testSendingName"`
    );
    await queryRunner.query(
      `ALTER TABLE "account" DROP COLUMN "posthogFirebaseDeviceTokenKey"`
    );
    await queryRunner.query(
      `ALTER TABLE "account" DROP COLUMN "firebaseCredentials"`
    );
    await queryRunner.query(
      `ALTER TABLE "account" DROP COLUMN "timezoneUTCOffset"`
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces" ADD "messagesSent" integer NOT NULL DEFAULT '0'`
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD CONSTRAINT "UQ_4c8f96ccf523e9a3faefd5bdd4c" UNIQUE ("email")`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "account" DROP CONSTRAINT "UQ_4c8f96ccf523e9a3faefd5bdd4c"`
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces" DROP COLUMN "messagesSent"`
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD "timezoneUTCOffset" character varying NOT NULL DEFAULT 'UTC+00:00'`
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD "firebaseCredentials" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD "posthogFirebaseDeviceTokenKey" text`
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD "testSendingName" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD "testSendingEmail" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD "emailProvider" character varying`
    );
    await queryRunner.query(`ALTER TABLE "account" ADD "posthogEmailKey" text`);
    await queryRunner.query(`ALTER TABLE "account" ADD "posthogSmsKey" text`);
    await queryRunner.query(`ALTER TABLE "account" ADD "posthogHostUrl" text`);
    await queryRunner.query(
      `ALTER TABLE "account" ADD "posthogProjectId" text`
    );
    await queryRunner.query(`ALTER TABLE "account" ADD "posthogApiKey" text`);
    await queryRunner.query(`ALTER TABLE "account" ADD "slackTeamId" text`);
    await queryRunner.query(
      `ALTER TABLE "account" ADD "sendingName" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD "sendingEmail" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD "sendingDomain" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD "mailgunAPIKey" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD "apiKey" character varying NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD "freeEmailsCount" integer NOT NULL DEFAULT '3'`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."account_plan_enum" AS ENUM('free', 'paid', 'enterprise')`
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD "plan" "public"."account_plan_enum" NOT NULL DEFAULT 'free'`
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD "messagesSent" integer NOT NULL DEFAULT '0'`
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD CONSTRAINT "UQ_5ffe3d9a0bf0174b51f40eecdc6" UNIQUE ("email", "apiKey")`
    );
  }
}
