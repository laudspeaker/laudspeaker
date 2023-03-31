import { MigrationInterface, QueryRunner } from 'typeorm';

export class Recovery1677238588984 implements MigrationInterface {
  name = 'Recovery1677238588984';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "recovery" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "accountId" uuid, CONSTRAINT "PK_47b2530af2d597ff1b210847140" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "recovery" ADD CONSTRAINT "FK_9c3cef69cfe42acc5f682169763" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "recovery" DROP CONSTRAINT "FK_9c3cef69cfe42acc5f682169763"`
    );
    await queryRunner.query(`DROP TABLE "recovery"`);
  }
}
