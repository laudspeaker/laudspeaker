import { MigrationInterface, QueryRunner } from "typeorm";

export class WebhookEvent1672742730146 implements MigrationInterface {
    name = 'WebhookEvent1672742730146'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."webhook_event_eventprovider_enum" AS ENUM('mailgun', 'sendgrid', 'twillio')`);
        await queryRunner.query(`CREATE TABLE "webhook_event" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "customerId" character varying NOT NULL, "messageId" character varying NOT NULL, "event" character varying NOT NULL, "eventProvider" "public"."webhook_event_eventprovider_enum" NOT NULL, "createdAt" character varying NOT NULL, "audienceId" uuid, CONSTRAINT "PK_0f56d2f40f5ec823acf8e8edad1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "webhook_event" ADD CONSTRAINT "FK_1926eaf2385eacb83fa28c928ce" FOREIGN KEY ("audienceId") REFERENCES "audience"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "webhook_event" DROP CONSTRAINT "FK_1926eaf2385eacb83fa28c928ce"`);
        await queryRunner.query(`DROP TABLE "webhook_event"`);
        await queryRunner.query(`DROP TYPE "public"."webhook_event_eventprovider_enum"`);
    }

}
