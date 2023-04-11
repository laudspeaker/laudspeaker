import { MigrationInterface, QueryRunner } from "typeorm";

export class CreatedAt1681207893004 implements MigrationInterface {
    name = 'CreatedAt1681207893004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "template" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "workflow" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workflow" DROP COLUMN "createdAt"`);
        await queryRunner.query(`ALTER TABLE "template" DROP COLUMN "createdAt"`);
    }

}
