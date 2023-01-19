import { MigrationInterface, QueryRunner } from "typeorm";

export class SyncToASegmentDelete1674126250972 implements MigrationInterface {
    name = 'SyncToASegmentDelete1674126250972'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "database" DROP COLUMN "syncToASegment"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "database" ADD "syncToASegment" boolean NOT NULL`);
    }

}
