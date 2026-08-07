import { MigrationInterface, QueryRunner } from "typeorm";

export class CustomerKeys1724873583655 implements MigrationInterface {
  name = 'CustomerKeys1724873583655'

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE customer_key
      (
        id                            SERIAL        NOT NULL,
        name                          varchar       NOT NULL,
        is_primary                    boolean       NOT NULL,
        attribute_type_id             integer,
        attribute_subtype_id          integer,
        attribute_parameter_id        integer,
        workspace_id                  uuid,
        CONSTRAINT "PK_661d131a7b7705b40d5ec6407b0" PRIMARY KEY ("id")
      )`
    );
    await queryRunner.query(`CREATE INDEX "IDX_01d6b2d5e310e1a76276a04f6d" ON "customer_key" ("name") `);
    await queryRunner.query(`ALTER TABLE "customer_key" ADD CONSTRAINT "FK_4537083503bb264d93148df36ac" FOREIGN KEY ("attribute_type_id") REFERENCES "attribute_type"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "customer_key" ADD CONSTRAINT "FK_2d3a8845db5c489696b874de5d8" FOREIGN KEY ("attribute_subtype_id") REFERENCES "attribute_type"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "customer_key" ADD CONSTRAINT "FK_1f160631ff718c3338e7c96b7f7" FOREIGN KEY ("attribute_parameter_id") REFERENCES "attribute_parameter"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    await queryRunner.query(`ALTER TABLE "customer_key" ADD CONSTRAINT "FK_3073850a7718194f3d01c3410db" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "customer_key" DROP CONSTRAINT "FK_3073850a7718194f3d01c3410db"`);
    await queryRunner.query(`ALTER TABLE "customer_key" DROP CONSTRAINT "FK_1f160631ff718c3338e7c96b7f7"`);
    await queryRunner.query(`ALTER TABLE "customer_key" DROP CONSTRAINT "FK_2d3a8845db5c489696b874de5d8"`);
    await queryRunner.query(`ALTER TABLE "customer_key" DROP CONSTRAINT "FK_4537083503bb264d93148df36ac"`);
    await queryRunner.query(`DROP INDEX "public"."IDX_01d6b2d5e310e1a76276a04f6d"`);
    await queryRunner.query(`DROP TABLE "customer_key"`);
  }
}
