import { MigrationInterface, QueryRunner } from "typeorm";

export class NewJourneyStepEnumFix1686228815449 implements MigrationInterface {
    name = 'NewJourneyStepEnumFix1686228815449'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "step" DROP COLUMN "type"`);
        await queryRunner.query(`ALTER TABLE "step" ADD "type" character varying NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "step" DROP COLUMN "type"`);
        await queryRunner.query(`ALTER TABLE "step" ADD "type" integer NOT NULL`);
    }

}
