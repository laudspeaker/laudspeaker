import { MigrationInterface, QueryRunner } from "typeorm";

export class SegmentResources1671098271359 implements MigrationInterface {
    name = 'SegmentResources1671098271359'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "segment" ADD "resources" jsonb NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "segment" DROP COLUMN "resources"`);
    }

}
