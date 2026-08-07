import { MigrationInterface, QueryRunner } from "typeorm";

export class JourneySystemSegmentCount1721445254349 implements MigrationInterface {
    name = 'JourneySystemSegmentCount1721445254349'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "journey" ADD "completedSystemSegments" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "journey" ADD "totalSystemSegments" integer NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "journey" DROP COLUMN "totalSystemSegments"`);
        await queryRunner.query(`ALTER TABLE "journey" DROP COLUMN "completedSystemSegments"`);
    }
}
