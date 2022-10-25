import { MigrationInterface, QueryRunner } from "typeorm";

export class Init1666714220121 implements MigrationInterface {
    name = 'Init1666714220121'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "audience" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "ownerId" character varying NOT NULL, "description" character varying, "isPrimary" boolean DEFAULT true, "isDynamic" boolean NOT NULL DEFAULT true, "customers" text array NOT NULL DEFAULT '{}', "templates" text array NOT NULL DEFAULT '{}', "inclusionCriteria" jsonb NOT NULL DEFAULT '{"conditionalType":"and","conditions":[]}', "resources" jsonb, "isEditable" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_2ecf18dc010ddf7e956afd9866b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "stats" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "sentAmount" integer NOT NULL DEFAULT '0', "audienceId" uuid, CONSTRAINT "REL_321286655ffc8a394eb2a3c62e" UNIQUE ("audienceId"), CONSTRAINT "PK_c76e93dfef28ba9b6942f578ab1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "state" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "installUrlOptions" jsonb NOT NULL, "now" TIMESTAMP NOT NULL, CONSTRAINT "PK_549ffd046ebab1336c3a8030a12" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "installation" ("id" character varying NOT NULL, "installation" jsonb NOT NULL, CONSTRAINT "PK_f0cd0b17a45357b5e1da1da1680" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "template" ("id" SERIAL NOT NULL, "name" character varying NOT NULL, "ownerId" character varying NOT NULL, "text" character varying, "style" character varying, "subject" character varying, "slackMessage" character varying, "type" character varying NOT NULL, CONSTRAINT "PK_fbae2ac36bd9b5e1e793b957b7f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "account" ("id" SERIAL NOT NULL, "email" character varying NOT NULL, "apiKey" character varying NOT NULL, "password" character varying NOT NULL, "firstName" character varying, "lastName" character varying, "lastLoginAt" TIMESTAMP, "verified" boolean NOT NULL DEFAULT false, "mailgunAPIKey" character varying, "sendingDomain" character varying, "sendingEmail" character varying, "sendingName" character varying, "slackTeamId" text, "posthogApiKey" text, "posthogProjectId" text, "posthogHostUrl" text, "posthogSmsKey" text, "posthogEmailKey" text, "expectedOnboarding" character varying array NOT NULL DEFAULT '{}', "currentOnboarding" character varying array NOT NULL DEFAULT '{}', "onboarded" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_5ffe3d9a0bf0174b51f40eecdc6" UNIQUE ("email", "apiKey"), CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "workflow" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "ownerId" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT false, "isPaused" boolean NOT NULL DEFAULT false, "isStopped" boolean NOT NULL DEFAULT false, "audiences" text array NOT NULL DEFAULT '{}', "rules" text, "visualLayout" jsonb, CONSTRAINT "PK_eb5e4cc1a9ef2e94805b676751b" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "stats" ADD CONSTRAINT "FK_321286655ffc8a394eb2a3c62e6" FOREIGN KEY ("audienceId") REFERENCES "audience"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "stats" DROP CONSTRAINT "FK_321286655ffc8a394eb2a3c62e6"`);
        await queryRunner.query(`DROP TABLE "workflow"`);
        await queryRunner.query(`DROP TABLE "account"`);
        await queryRunner.query(`DROP TABLE "template"`);
        await queryRunner.query(`DROP TABLE "installation"`);
        await queryRunner.query(`DROP TABLE "state"`);
        await queryRunner.query(`DROP TABLE "stats"`);
        await queryRunner.query(`DROP TABLE "audience"`);
    }

}
