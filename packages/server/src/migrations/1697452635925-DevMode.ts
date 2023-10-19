import { MigrationInterface, QueryRunner } from "typeorm";

export class DevMode1697452635925 implements MigrationInterface {
    name = 'DevMode1697452635925'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "dev_mode" ("ownerId" uuid NOT NULL, "journeyId" uuid NOT NULL, "devModeState" jsonb NOT NULL, CONSTRAINT "PK_cf1d403bab10d946393c562adc9" PRIMARY KEY ("ownerId", "journeyId"))`);
        await queryRunner.query(`ALTER TABLE "dev_mode" ADD CONSTRAINT "FK_7f48a0703c124884c02a8696be5" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "dev_mode" ADD CONSTRAINT "FK_e40da2cf95663b3e7a0b13ac6ae" FOREIGN KEY ("journeyId") REFERENCES "journey"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "dev_mode" DROP CONSTRAINT "FK_e40da2cf95663b3e7a0b13ac6ae"`);
        await queryRunner.query(`ALTER TABLE "dev_mode" DROP CONSTRAINT "FK_7f48a0703c124884c02a8696be5"`);
        await queryRunner.query(`DROP TABLE "dev_mode"`);
    }

}
