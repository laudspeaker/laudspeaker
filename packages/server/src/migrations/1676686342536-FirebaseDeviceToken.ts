import { MigrationInterface, QueryRunner } from "typeorm";

export class FirebaseDeviceToken1676686342536 implements MigrationInterface {
    name = 'FirebaseDeviceToken1676686342536'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account" ADD "posthogFirebaseDeviceTokenKey" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "posthogFirebaseDeviceTokenKey"`);
    }

}
