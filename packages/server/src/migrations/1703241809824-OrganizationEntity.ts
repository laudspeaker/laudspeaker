import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrganizationEntity1703241809824 implements MigrationInterface {
  name = 'OrganizationEntity1703241809824';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TYPE "public"."organization_plan_enum" AS ENUM('free', 'paid', 'enterprise')`
    );
    await queryRunner.query(
      `CREATE TABLE "organization" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "companyName" character varying NOT NULL, "timezoneUTCOffset" character varying NOT NULL DEFAULT 'UTC+00:00', "apiKey" character varying NOT NULL, "plan" "public"."organization_plan_enum" NOT NULL DEFAULT 'free', "mailgunAPIKey" character varying, "sendingDomain" character varying, "sendingEmail" character varying, "sendingName" character varying, "slackTeamId" text, "posthogApiKey" text, "posthogProjectId" text, "posthogHostUrl" text, "posthogSmsKey" text, "posthogEmailKey" text, "posthogFirebaseDeviceTokenKey" text, "firebaseCredentials" character varying, "customerId" character varying, "emailProvider" character varying, "testSendingEmail" character varying, "testSendingName" character varying, "freeEmailsCount" integer NOT NULL DEFAULT '3', "sendgridApiKey" character varying, "sendgridFromEmail" character varying, "sendgridVerificationKey" character varying, "smsAccountSid" character varying, "smsAuthToken" character varying, "smsFrom" character varying, "posthogSetupped" boolean NOT NULL DEFAULT false, "javascriptSnippetSetupped" boolean NOT NULL DEFAULT false, "pushPlatforms" jsonb NOT NULL DEFAULT '{}', "ownerId" uuid, CONSTRAINT "REL_67c515257c7a4bc221bb1857a3" UNIQUE ("ownerId"), CONSTRAINT "PK_472c1f99a32def1b0abb219cd67" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "organization_team" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "teamName" character varying NOT NULL DEFAULT 'Default team', "organizationId" uuid, CONSTRAINT "PK_edd4226d4171cbe90fd0ee16a2a" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" ADD CONSTRAINT "FK_67c515257c7a4bc221bb1857a39" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "organization_team" ADD CONSTRAINT "FK_eef1c19a0cb5321223cfe3286c4" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organization_team" DROP CONSTRAINT "FK_eef1c19a0cb5321223cfe3286c4"`
    );
    await queryRunner.query(
      `ALTER TABLE "organization" DROP CONSTRAINT "FK_67c515257c7a4bc221bb1857a39"`
    );
    await queryRunner.query(`DROP TABLE "organization_team"`);
    await queryRunner.query(`DROP TABLE "organization"`);
    await queryRunner.query(`DROP TYPE "public"."organization_plan_enum"`);
  }
}
