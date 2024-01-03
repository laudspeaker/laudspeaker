import { MigrationInterface, QueryRunner } from "typeorm";

export class DevModeWorkspaceIdPK1704275829685 implements MigrationInterface {
    name = 'DevModeWorkspaceIdPK1704275829685'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dev_mode" DROP CONSTRAINT "PK_cf1d403bab10d946393c562adc9"`);
        await queryRunner.query(`ALTER TABLE "dev_mode" ADD CONSTRAINT "PK_b73c33014d59aaf71e6bdefb54b" PRIMARY KEY ("ownerId", "workspaceId", "journeyId")`);
        await queryRunner.query(`ALTER TABLE "dev_mode" DROP CONSTRAINT "FK_f890f44290b08bfed2ab4ff625e"`);
        await queryRunner.query(`ALTER TABLE "dev_mode" ALTER COLUMN "workspaceId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "dev_mode" ADD CONSTRAINT "FK_f890f44290b08bfed2ab4ff625e" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dev_mode" DROP CONSTRAINT "FK_f890f44290b08bfed2ab4ff625e"`);
        await queryRunner.query(`ALTER TABLE "dev_mode" ALTER COLUMN "workspaceId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "dev_mode" ADD CONSTRAINT "FK_f890f44290b08bfed2ab4ff625e" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dev_mode" DROP CONSTRAINT "PK_b73c33014d59aaf71e6bdefb54b"`);
        await queryRunner.query(`ALTER TABLE "dev_mode" ADD CONSTRAINT "PK_cf1d403bab10d946393c562adc9" PRIMARY KEY ("ownerId", "journeyId")`);
    }

}
