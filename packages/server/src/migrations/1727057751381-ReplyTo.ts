import { MigrationInterface, QueryRunner } from "typeorm";

export class ReplyTo1727057751381 implements MigrationInterface {
    name = 'ReplyTo1727057751381'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "mailgun_reply_to_option" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "replyToEmail" character varying NOT NULL, "replyToName" character varying, "mailgunConnectionId" uuid NOT NULL, CONSTRAINT "UQ_23d29eacd371242b734fa323be9" UNIQUE ("mailgunConnectionId", "replyToEmail", "replyToName"), CONSTRAINT "PK_9ab2334bbc98eab535dcec18c8c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sendgrid_reply_to_option" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "replyToEmail" character varying NOT NULL, "replyToName" character varying, "sendgridConnectionId" uuid NOT NULL, CONSTRAINT "UQ_cf7316471cec37a0d77d2cd1502" UNIQUE ("sendgridConnectionId", "replyToEmail", "replyToName"), CONSTRAINT "PK_853d85759673cb520bf1394c59e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "resend_reply_to_option" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "replyToEmail" character varying NOT NULL, "replyToName" character varying, "resendConnectionId" uuid NOT NULL, CONSTRAINT "UQ_69492e1ce3cc14e9bfb27b2056d" UNIQUE ("resendConnectionId", "replyToEmail", "replyToName"), CONSTRAINT "PK_b128acf6282b1df64d17324cc34" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "sendgrid_sending_option" ADD "sendingName" character varying`);
        await queryRunner.query(`ALTER TABLE "mailgun_sending_option" DROP CONSTRAINT "UQ_df7ce6c91fa5d188ec63f365b1a"`);
        await queryRunner.query(`ALTER TABLE "mailgun_sending_option" ALTER COLUMN "sendingName" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "resend_sending_option" DROP CONSTRAINT "UQ_5b4affc388cbe023e136ebcff44"`);
        await queryRunner.query(`ALTER TABLE "resend_sending_option" ALTER COLUMN "sendingName" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "mailgun_sending_option" ADD CONSTRAINT "UQ_df7ce6c91fa5d188ec63f365b1a" UNIQUE ("mailgunConnectionId", "sendingEmail", "sendingName")`);
        await queryRunner.query(`ALTER TABLE "resend_sending_option" ADD CONSTRAINT "UQ_5b4affc388cbe023e136ebcff44" UNIQUE ("resendConnectionId", "sendingEmail", "sendingName")`);
        await queryRunner.query(`ALTER TABLE "mailgun_reply_to_option" ADD CONSTRAINT "FK_d91cfeca253eae2ab3879786ca7" FOREIGN KEY ("mailgunConnectionId") REFERENCES "workspace_mailgun_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "sendgrid_reply_to_option" ADD CONSTRAINT "FK_3e131da5c0aa2032a9c3641df96" FOREIGN KEY ("sendgridConnectionId") REFERENCES "workspace_sendgrid_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "resend_reply_to_option" ADD CONSTRAINT "FK_6b6df753841ea18112bbf3617ae" FOREIGN KEY ("resendConnectionId") REFERENCES "workspace_resend_connection"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "resend_reply_to_option" DROP CONSTRAINT "FK_6b6df753841ea18112bbf3617ae"`);
        await queryRunner.query(`ALTER TABLE "sendgrid_reply_to_option" DROP CONSTRAINT "FK_3e131da5c0aa2032a9c3641df96"`);
        await queryRunner.query(`ALTER TABLE "mailgun_reply_to_option" DROP CONSTRAINT "FK_d91cfeca253eae2ab3879786ca7"`);
        await queryRunner.query(`ALTER TABLE "resend_sending_option" DROP CONSTRAINT "UQ_5b4affc388cbe023e136ebcff44"`);
        await queryRunner.query(`ALTER TABLE "mailgun_sending_option" DROP CONSTRAINT "UQ_df7ce6c91fa5d188ec63f365b1a"`);
        await queryRunner.query(`ALTER TABLE "resend_sending_option" ALTER COLUMN "sendingName" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "resend_sending_option" ADD CONSTRAINT "UQ_5b4affc388cbe023e136ebcff44" UNIQUE ("sendingEmail", "sendingName", "resendConnectionId")`);
        await queryRunner.query(`ALTER TABLE "mailgun_sending_option" ALTER COLUMN "sendingName" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "mailgun_sending_option" ADD CONSTRAINT "UQ_df7ce6c91fa5d188ec63f365b1a" UNIQUE ("sendingEmail", "sendingName", "mailgunConnectionId")`);
        await queryRunner.query(`ALTER TABLE "sendgrid_sending_option" DROP COLUMN "sendingName"`);
        await queryRunner.query(`DROP TABLE "resend_reply_to_option"`);
        await queryRunner.query(`DROP TABLE "sendgrid_reply_to_option"`);
        await queryRunner.query(`DROP TABLE "mailgun_reply_to_option"`);
    }

}
