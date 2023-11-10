import { MigrationInterface, QueryRunner } from "typeorm";

export class JourneySettings1699545812785 implements MigrationInterface {
    name = 'JourneySettings1699545812785'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "journey" ADD "journeyEntrySettings" jsonb`);
        await queryRunner.query(`ALTER TABLE "journey" ADD "journeySettings" jsonb`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "journey" DROP COLUMN "journeySettings"`);
        await queryRunner.query(`ALTER TABLE "journey" DROP COLUMN "journeyEntrySettings"`);
    }

}
