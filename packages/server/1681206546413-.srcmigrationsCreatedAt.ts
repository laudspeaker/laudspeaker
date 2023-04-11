import { MigrationInterface, QueryRunner } from "typeorm";

export class .srcmigrationsCreatedAt1681206546413 implements MigrationInterface {
    name = '.srcmigrationsCreatedAt1681206546413'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "template" ALTER COLUMN "createdAt" SET DEFAULT now()`);
        await queryRunner.query(`ALTER TABLE "workflow" ALTER COLUMN "createdAt" SET DEFAULT now()`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workflow" ALTER COLUMN "createdAt" SET DEFAULT '2023-04-11 09:39:57.209'`);
        await queryRunner.query(`ALTER TABLE "template" ALTER COLUMN "createdAt" SET DEFAULT '2023-04-11 09:39:57.132'`);
    }

}
