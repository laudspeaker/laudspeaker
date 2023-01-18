import { MigrationInterface, QueryRunner } from "typeorm";

export class Integrations1674052167119 implements MigrationInterface {
    name = 'Integrations1674052167119'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "database" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "frequencyNumber" integer NOT NULL, "frequencyUnit" character varying NOT NULL, "peopleIdentification" character varying NOT NULL, "syncToASegment" boolean NOT NULL, "connectionString" character varying NOT NULL, "dbType" character varying NOT NULL, "query" character varying NOT NULL, CONSTRAINT "PK_ef0ad4a88bc632fd4d6a0b09ddf" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "integration" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "description" character varying NOT NULL, "type" character varying NOT NULL, "ownerId" integer, "databaseId" uuid, CONSTRAINT "REL_0785ddd349cab5c06be05bf852" UNIQUE ("databaseId"), CONSTRAINT "PK_f348d4694945d9dc4c7049a178a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "integration" ADD CONSTRAINT "FK_f470dfd06183e7bfa12e4ed7d51" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "integration" ADD CONSTRAINT "FK_0785ddd349cab5c06be05bf8528" FOREIGN KEY ("databaseId") REFERENCES "database"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "integration" DROP CONSTRAINT "FK_0785ddd349cab5c06be05bf8528"`);
        await queryRunner.query(`ALTER TABLE "integration" DROP CONSTRAINT "FK_f470dfd06183e7bfa12e4ed7d51"`);
        await queryRunner.query(`DROP TABLE "integration"`);
        await queryRunner.query(`DROP TABLE "database"`);
    }

}
