import { MigrationInterface, QueryRunner } from 'typeorm';

export class ModalEvent1682341047284 implements MigrationInterface {
  name = 'ModalEvent1682341047284';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "modal_event" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "customerId" character varying NOT NULL, "expiresAt" TIMESTAMP NOT NULL, "templateId" integer, CONSTRAINT "PK_f8e6c2ab1151f5cce65a74cacd6" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "modal_event" ADD CONSTRAINT "FK_a27960f25b2510740f5da9453f5" FOREIGN KEY ("templateId") REFERENCES "template"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "modal_event" DROP CONSTRAINT "FK_a27960f25b2510740f5da9453f5"`
    );
    await queryRunner.query(`DROP TABLE "modal_event"`);
  }
}
