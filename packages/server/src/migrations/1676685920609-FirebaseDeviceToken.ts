import { MigrationInterface, QueryRunner } from "typeorm";

export class FirebaseDeviceToken1676685920609 implements MigrationInterface {
    name = 'FirebaseDeviceToken1676685920609'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account" ADD "posthogFirebaseDeviceTokenKey" character varying`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "posthogFirebaseDeviceTokenKey"`);
    }

}
