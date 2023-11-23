import { MigrationInterface, QueryRunner } from "typeorm";

export class PushNotificationUpdate1700754382003 implements MigrationInterface {
    name = 'PushNotificationUpdate1700754382003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "template" DROP COLUMN "pushText"`);
        await queryRunner.query(`ALTER TABLE "template" DROP COLUMN "pushTitle"`);
        await queryRunner.query(`ALTER TABLE "template" ADD "pushObject" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "template" DROP COLUMN "pushObject"`);
        await queryRunner.query(`ALTER TABLE "template" ADD "pushTitle" character varying`);
        await queryRunner.query(`ALTER TABLE "template" ADD "pushText" character varying`);
    }

}
