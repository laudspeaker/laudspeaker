import { MigrationInterface, QueryRunner } from "typeorm";

export class SendgridEvent1668700326983 implements MigrationInterface {
    name = 'SendgridEvent1668700326983'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "sendgrid_event" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "audienceId" character varying NOT NULL, "customerId" character varying NOT NULL, "messageId" character varying NOT NULL, "event" character varying NOT NULL, "createdAt" character varying NOT NULL, CONSTRAINT "PK_3d47ba201507930dc1845df607f" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "sendgrid_event"`);
    }

}
