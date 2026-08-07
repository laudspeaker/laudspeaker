import { MigrationInterface, QueryRunner } from "typeorm";

export class InAppMessages1727057751383 implements MigrationInterface {
    name = 'InAppMessages1727057751383'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "template" RENAME COLUMN "modalState" TO "inAppState"`);
        await queryRunner.query(`ALTER TABLE "modal_event" ADD "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "modal_event" DROP COLUMN "created_at"`);
        await queryRunner.query(`ALTER TABLE "template" RENAME COLUMN "inAppState" TO "modalState"`);
    }

}
