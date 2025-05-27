import { MigrationInterface, QueryRunner } from "typeorm";

export class NotificationPreferences1727057751382 implements MigrationInterface {
    name = 'NotificationPreferences1727057751382'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "notifcation_preference" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "title" character varying(255) NOT NULL, "name" character varying(255) NOT NULL, "description" text, "journey_tags" text, "channels" text, "template_tags" text, "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "workspaceId" uuid, CONSTRAINT "PK_782f05a11dbfe97f0581afd5fad" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_d2c25a11d296aac624be1278b3" ON "notifcation_preference" ("name", "workspaceId") `);
        await queryRunner.query(`ALTER TABLE "notifcation_preference" ADD CONSTRAINT "FK_6e4c25e05efa592f05bcd9ec44e" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "notifcation_preference" DROP CONSTRAINT "FK_6e4c25e05efa592f05bcd9ec44e"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d2c25a11d296aac624be1278b3"`);
        await queryRunner.query(`DROP TABLE "notifcation_preference"`);
    }

}
