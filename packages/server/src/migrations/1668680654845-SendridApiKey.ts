import { MigrationInterface, QueryRunner } from 'typeorm';

export class SendridApiKey1668680654845 implements MigrationInterface {
  name = 'SendridApiKey1668680654845';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "account" ADD "sendgridApiKey" character varying`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "account" DROP COLUMN "sendgridApiKey"`
    );
  }
}
