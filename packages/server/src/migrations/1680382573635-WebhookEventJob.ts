import { MigrationInterface, QueryRunner } from 'typeorm';

export class WebhookEventJob1680382573635 implements MigrationInterface {
  name = 'WebhookEventJob1680382573635';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "webhook_job" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "provider" integer NOT NULL, "status" integer NOT NULL DEFAULT '1', CONSTRAINT "PK_5de4cc5aaca7063dc5148b77f0e" PRIMARY KEY ("id"))`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP TABLE "webhook_job"`);
  }
}
