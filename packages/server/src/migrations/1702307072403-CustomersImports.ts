import { MigrationInterface, QueryRunner } from "typeorm";

export class CustomersImports1702307072403 implements MigrationInterface {
    name = 'CustomersImports1702307072403'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "imports" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "fileKey" character varying NOT NULL, "fileName" character varying NOT NULL, "headers" jsonb NOT NULL, "accountId" uuid, CONSTRAINT "UQ_346c168631dc879c85031d210ca" UNIQUE ("accountId", "fileKey"), CONSTRAINT "PK_ea10c62f5eb1d75e83d8b5225db" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "imports" ADD CONSTRAINT "FK_1381bc9a9c06a256e6e52092bd6" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "imports" DROP CONSTRAINT "FK_1381bc9a9c06a256e6e52092bd6"`);
        await queryRunner.query(`DROP TABLE "imports"`);
    }

}
