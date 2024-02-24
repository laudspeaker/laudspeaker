import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeparatedChannelConnections1708424503801
  implements MigrationInterface
{
  name = 'SeparatedChannelConnections1708424503801';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workspace" DROP CONSTRAINT "FK_8f75913774150a5d5dde56513b1"`
    );
    await queryRunner.query(
      `CREATE TABLE "mailgun_sending_option" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sendingEmail" character varying NOT NULL, "sendingName" character varying NOT NULL, "mailgunConnectionId" uuid NOT NULL, CONSTRAINT "UQ_df7ce6c91fa5d188ec63f365b1a" UNIQUE ("mailgunConnectionId", "sendingEmail", "sendingName"), CONSTRAINT "PK_14b7ce1f2d2518c5c71e30db713" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "workspace_mailgun_connection" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "apiKey" character varying NOT NULL, "sendingDomain" character varying NOT NULL, "workspaceId" uuid NOT NULL, CONSTRAINT "PK_e052f23a025a6ed6171636fff9b" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "sendgrid_sending_option" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sendingEmail" character varying NOT NULL, "sendgridConnectionId" uuid NOT NULL, CONSTRAINT "UQ_c18275312f62bacab6d7433f041" UNIQUE ("sendgridConnectionId", "sendingEmail"), CONSTRAINT "PK_def14d0e7b0a331ef03b123ff73" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "workspace_sendgrid_connection" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "apiKey" character varying NOT NULL, "verificationKey" character varying NOT NULL, "workspaceId" uuid NOT NULL, CONSTRAINT "PK_02e0e39a8932b266e7cf81fb250" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "workspace_twilio_connection" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "sid" character varying NOT NULL, "token" character varying NOT NULL, "from" character varying NOT NULL, "workspaceId" uuid NOT NULL, CONSTRAINT "PK_39deb1d523e5320d78232f925ee" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "workspace_push_connection" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "pushPlatforms" jsonb NOT NULL DEFAULT '{}', "workspaceId" uuid NOT NULL, CONSTRAINT "PK_e6d806d6c5969743af02db697ee" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "resend_sending_option" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sendingEmail" character varying NOT NULL, "sendingName" character varying NOT NULL, "resendConnectionId" uuid NOT NULL, CONSTRAINT "UQ_5b4affc388cbe023e136ebcff44" UNIQUE ("resendConnectionId", "sendingEmail", "sendingName"), CONSTRAINT "PK_2e6942fab1880df7e3b11ceb9e4" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "workspace_resend_connection" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "apiKey" character varying NOT NULL, "signingSecret" character varying NOT NULL, "sendingDomain" character varying NOT NULL, "workspaceId" uuid NOT NULL, CONSTRAINT "PK_f9b507739b524a220f79e05294e" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_push_connection" DROP CONSTRAINT "UQ_1b07bbfd37209fbe65202a590ec"`
    );
    await queryRunner.query(
      `ALTER TYPE "public"."workspaces_plan_enum" RENAME TO "workspaces_plan_enum_old"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workspace_plan_enum" AS ENUM('free', 'paid', 'enterprise')`
    );
    await queryRunner.query(
      `ALTER TABLE "workspace" ALTER COLUMN "plan" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "workspace" ALTER COLUMN "plan" TYPE "public"."workspace_plan_enum" USING "plan"::"text"::"public"."workspace_plan_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "workspace" ALTER COLUMN "plan" SET DEFAULT 'free'`
    );
    await queryRunner.query(`DROP TYPE "public"."workspaces_plan_enum_old"`);
    await queryRunner.query(
      `ALTER TABLE "workspace_push_connection" ADD CONSTRAINT "UQ_1b07bbfd37209fbe65202a590ec"`
    );
    await queryRunner.query(
      `ALTER TABLE "mailgun_sending_option" ADD CONSTRAINT "FK_8f3601882fb7d523f02f73a24ef" FOREIGN KEY ("mailgunConnectionId") REFERENCES "workspace_mailgun_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_mailgun_connection" ADD CONSTRAINT "FK_f3cae6163a9599d9d3c63ebf002" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "sendgrid_sending_option" ADD CONSTRAINT "FK_18bd23f84664a47da4670981ff4" FOREIGN KEY ("sendgridConnectionId") REFERENCES "workspace_sendgrid_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_sendgrid_connection" ADD CONSTRAINT "FK_9b1756127d9c9aebab656618f09" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_twilio_connection" ADD CONSTRAINT "FK_876099f62037557d45b16cc2d17" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_push_connection" ADD CONSTRAINT "FK_3cbbdd9d29d421a9c72974c8401" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "resend_sending_option" ADD CONSTRAINT "FK_dfc194137e542951a88c5aa4981" FOREIGN KEY ("resendConnectionId") REFERENCES "workspace_resend_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_resend_connection" ADD CONSTRAINT "FK_43777f92dbf11912f3c7f5fef95" FOREIGN KEY ("workspaceId") REFERENCES "workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
    await queryRunner.query(
      `ALTER TABLE "workspace" ADD CONSTRAINT "FK_a700527eb11f812d79f55907d33" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workspace" DROP CONSTRAINT "FK_a700527eb11f812d79f55907d33"`
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_resend_connection" DROP CONSTRAINT "FK_43777f92dbf11912f3c7f5fef95"`
    );
    await queryRunner.query(
      `ALTER TABLE "resend_sending_option" DROP CONSTRAINT "FK_dfc194137e542951a88c5aa4981"`
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_push_connection" DROP CONSTRAINT "FK_3cbbdd9d29d421a9c72974c8401"`
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_twilio_connection" DROP CONSTRAINT "FK_876099f62037557d45b16cc2d17"`
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_sendgrid_connection" DROP CONSTRAINT "FK_9b1756127d9c9aebab656618f09"`
    );
    await queryRunner.query(
      `ALTER TABLE "sendgrid_sending_option" DROP CONSTRAINT "FK_18bd23f84664a47da4670981ff4"`
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_mailgun_connection" DROP CONSTRAINT "FK_f3cae6163a9599d9d3c63ebf002"`
    );
    await queryRunner.query(
      `ALTER TABLE "mailgun_sending_option" DROP CONSTRAINT "FK_8f3601882fb7d523f02f73a24ef"`
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_push_connection" DROP CONSTRAINT "UQ_1b07bbfd37209fbe65202a590ec"`
    );
    await queryRunner.query(
      `CREATE TYPE "public"."workspaces_plan_enum_old" AS ENUM('free', 'paid', 'enterprise')`
    );
    await queryRunner.query(
      `ALTER TABLE "workspace" ALTER COLUMN "plan" DROP DEFAULT`
    );
    await queryRunner.query(
      `ALTER TABLE "workspace" ALTER COLUMN "plan" TYPE "public"."workspaces_plan_enum_old" USING "plan"::"text"::"public"."workspaces_plan_enum_old"`
    );
    await queryRunner.query(
      `ALTER TABLE "workspace" ALTER COLUMN "plan" SET DEFAULT 'free'`
    );
    await queryRunner.query(`DROP TYPE "public"."workspace_plan_enum"`);
    await queryRunner.query(
      `ALTER TYPE "public"."workspaces_plan_enum_old" RENAME TO "workspaces_plan_enum"`
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_push_connection" ADD CONSTRAINT "UQ_1b07bbfd37209fbe65202a590ec"`
    );
    await queryRunner.query(`DROP TABLE "workspace_resend_connection"`);
    await queryRunner.query(`DROP TABLE "resend_sending_option"`);
    await queryRunner.query(`DROP TABLE "workspace_push_connection"`);
    await queryRunner.query(`DROP TABLE "workspace_twilio_connection"`);
    await queryRunner.query(`DROP TABLE "workspace_sendgrid_connection"`);
    await queryRunner.query(`DROP TABLE "sendgrid_sending_option"`);
    await queryRunner.query(`DROP TABLE "workspace_mailgun_connection"`);
    await queryRunner.query(`DROP TABLE "mailgun_sending_option"`);
    await queryRunner.query(
      `ALTER TABLE "workspace" ADD CONSTRAINT "FK_8f75913774150a5d5dde56513b1" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }
}
