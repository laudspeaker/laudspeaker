import { MigrationInterface, QueryRunner } from "typeorm";

export class TimeTriggerJobs1674516266969 implements MigrationInterface {
    name = 'TimeTriggerJobs1674516266969'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "job" ("id" SERIAL NOT NULL, "owner" character varying NOT NULL, "from" character varying NOT NULL, "to" character varying NOT NULL, "workflow" character varying NOT NULL, "customer" character varying NOT NULL, "executionTime" TIMESTAMP, "startTime" TIMESTAMP, "endTime" TIMESTAMP, CONSTRAINT "PK_98ab1c14ff8d1cf80d18703b92f" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "job"`);
    }

}
