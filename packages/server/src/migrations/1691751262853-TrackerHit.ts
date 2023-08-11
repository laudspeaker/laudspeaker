import { MigrationInterface, QueryRunner } from "typeorm";

export class TrackerHit1691751262853 implements MigrationInterface {
    name = 'TrackerHit1691751262853'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tracker_hit" ("hash" character varying NOT NULL, "processed" boolean NOT NULL DEFAULT true, CONSTRAINT "PK_3fc8da7aa8a9f676299b88b7f44" PRIMARY KEY ("hash"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "tracker_hit"`);
    }

}
