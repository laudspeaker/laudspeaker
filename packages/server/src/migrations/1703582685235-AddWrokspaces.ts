import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddWrokspaces1703582685235 implements MigrationInterface {
  name = 'AddWrokspaces1703582685235';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organization_team_members_account" DROP CONSTRAINT "FK_139a514a64819f527af3f33aae2"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workspaces_plan_enum" AS ENUM('free', 'paid', 'enterprise')`
    );
    await queryRunner.query(
      `CREATE TABLE "workspaces" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "timezoneUTCOffset" character varying NOT NULL DEFAULT 'UTC+00:00', "apiKey" character varying NOT NULL, "plan" "public"."workspaces_plan_enum" NOT NULL DEFAULT 'free', "mailgunAPIKey" character varying, "sendingDomain" character varying, "sendingEmail" character varying, "sendingName" character varying, "slackTeamId" text, "posthogApiKey" text, "posthogProjectId" text, "posthogHostUrl" text, "posthogSmsKey" text, "posthogEmailKey" text, "posthogFirebaseDeviceTokenKey" text, "firebaseCredentials" character varying, "emailProvider" character varying, "testSendingEmail" character varying, "testSendingName" character varying, "freeEmailsCount" integer NOT NULL DEFAULT '3', "sendgridApiKey" character varying, "sendgridFromEmail" character varying, "sendgridVerificationKey" character varying, "smsAccountSid" character varying, "smsAuthToken" character varying, "smsFrom" character varying, "posthogSetupped" boolean NOT NULL DEFAULT false, "javascriptSnippetSetupped" boolean NOT NULL DEFAULT false, "pushPlatforms" jsonb NOT NULL DEFAULT '{}', "organizationId" uuid, CONSTRAINT "PK_098656ae401f3e1a4586f47fd8e" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "plan"`);
    await queryRunner.query(`DROP TYPE "public"."organization_plan_enum"`);
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "freeEmailsCount"`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "posthogSetupped"`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "javascriptSnippetSetupped"`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "pushPlatforms"`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "sendingEmail"`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "sendingName"`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "slackTeamId"`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "posthogApiKey"`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "posthogProjectId"`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "posthogHostUrl"`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "posthogSmsKey"`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "posthogEmailKey"`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "posthogFirebaseDeviceTokenKey"`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "firebaseCredentials"`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "customerId"`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "emailProvider"`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "testSendingEmail"`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "testSendingName"`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "sendgridApiKey"`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "sendgridFromEmail"`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "sendgridVerificationKey"`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "smsAccountSid"`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "smsAuthToken"`
    );
    await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "smsFrom"`);
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "timezoneUTCOffset"`
    );
    await queryRunner.query(`ALTER TABLE "organization" DROP COLUMN "apiKey"`);
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "mailgunAPIKey"`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP COLUMN "sendingDomain"`
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces" ADD CONSTRAINT "FK_8f75913774150a5d5dde56513b1" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "organization_team_members_account" ADD CONSTRAINT "FK_139a514a64819f527af3f33aae2" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organization_team_members_account" DROP CONSTRAINT "FK_139a514a64819f527af3f33aae2"`
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces" DROP CONSTRAINT "FK_8f75913774150a5d5dde56513b1"`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "sendingDomain" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "mailgunAPIKey" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "apiKey" character varying NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "timezoneUTCOffset" character varying NOT NULL DEFAULT 'UTC+00:00'`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "smsFrom" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "smsAuthToken" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "smsAccountSid" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "sendgridVerificationKey" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "sendgridFromEmail" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "sendgridApiKey" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "testSendingName" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "testSendingEmail" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "emailProvider" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "customerId" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "firebaseCredentials" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "posthogFirebaseDeviceTokenKey" text`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "posthogEmailKey" text`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "posthogSmsKey" text`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "posthogHostUrl" text`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "posthogProjectId" text`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "posthogApiKey" text`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "slackTeamId" text`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "sendingName" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "sendingEmail" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "pushPlatforms" jsonb NOT NULL DEFAULT '{}'`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "javascriptSnippetSetupped" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "posthogSetupped" boolean NOT NULL DEFAULT false`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "freeEmailsCount" integer NOT NULL DEFAULT '3'`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."organization_plan_enum" AS ENUM('free', 'paid', 'enterprise')`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD "plan" "public"."organization_plan_enum" NOT NULL DEFAULT 'free'`
    );
    await queryRunner.query(`DROP TABLE "workspaces"`);
    await queryRunner.query(`DROP TYPE "public"."workspaces_plan_enum"`);
    await queryRunner.query(
      `ALTER TABLE "organization_team_members_account" ADD CONSTRAINT "FK_139a514a64819f527af3f33aae2" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
  }
}
