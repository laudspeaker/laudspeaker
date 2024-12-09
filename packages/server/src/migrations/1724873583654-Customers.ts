import { MigrationInterface, QueryRunner } from "typeorm";

export class Customers1724873583654 implements MigrationInterface {
  name = 'Customers1724873583654'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`CREATE EXTENSION pg_uuidv7;`);
    await queryRunner.query(
      `CREATE TABLE customer
      (
        id                        BIGSERIAL           NOT NULL,
        uuid                      UUID                NOT NULL          DEFAULT uuid_generate_v7(),
        user_attributes           jsonb               NOT NULL          DEFAULT '{}',
        system_attributes         jsonb               NOT NULL          DEFAULT '{}',
        created_at                TIMESTAMP           NOT NULL          DEFAULT NOW(),
        updated_at                TIMESTAMP           NOT NULL          DEFAULT NOW(),
        other_ids                 text array          NOT NULL          DEFAULT ARRAY[]::text[],
        workspace_id              uuid,
        customer_id               bigint,
        CONSTRAINT "UQ_19468a0ccfcf3e76cbb7789cb75" UNIQUE ("uuid"),
        CONSTRAINT "PK_a7a13f4cacb744524e44dfdad32" PRIMARY KEY ("id")
      )`
    );
    await queryRunner.query(`CREATE INDEX "IDX_19468a0ccfcf3e76cbb7789cb7" ON "customer" ("uuid") `);
    await queryRunner.query(`CREATE INDEX "IDX_542e54d042b1388b615f7434d2" ON "customer" ("created_at") `);
    await queryRunner.query(`CREATE INDEX "IDX_403a1d839933a1df8c5f463ffe" ON "customer" ("updated_at") `);
    await queryRunner.query(`CREATE INDEX "IDX_243eb351bf166bf6b84715e14f" ON "customer" ("customer_id", "workspace_id") `);
    await queryRunner.query(`ALTER TABLE "customer" ADD CONSTRAINT "FK_1288a14f94b7e560261d24656bd" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);

  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "customer" DROP CONSTRAINT "FK_1288a14f94b7e560261d24656bd"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_403a1d839933a1df8c5f463ffe"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_542e54d042b1388b615f7434d2"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_19468a0ccfcf3e76cbb7789cb7"`);
    await queryRunner.query(`DROP TABLE "customer"`);
  }
}
