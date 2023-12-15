import { MigrationInterface, QueryRunner } from "typeorm";

export class RequeueMessageTable1702674806046 implements MigrationInterface {
    name = 'RequeueMessageTable1702674806046'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "requeue" ("customerId" character varying NOT NULL, "ownerId" uuid NOT NULL, "stepId" uuid NOT NULL, "requeueAt" TIMESTAMP WITH TIME ZONE NOT NULL, CONSTRAINT "PK_3bbb63d1d84962e9f6ce1c5dce9" PRIMARY KEY ("customerId", "ownerId", "stepId"))`);
        await queryRunner.query(`ALTER TABLE "account" ADD "timezoneUTCOffset" character varying NOT NULL DEFAULT 'UTC+00:00'`);
        await queryRunner.query(`ALTER TABLE "requeue" ADD CONSTRAINT "FK_9177681f9f569d2d51ce9607aa0" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requeue" ADD CONSTRAINT "FK_1fd53477df179d2f0c65c4f571b" FOREIGN KEY ("stepId") REFERENCES "step"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "requeue" DROP CONSTRAINT "FK_1fd53477df179d2f0c65c4f571b"`);
        await queryRunner.query(`ALTER TABLE "requeue" DROP CONSTRAINT "FK_9177681f9f569d2d51ce9607aa0"`);
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "timezoneUTCOffset"`);
        await queryRunner.query(`DROP TABLE "requeue"`);
    }

}
