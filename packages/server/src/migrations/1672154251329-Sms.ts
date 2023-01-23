import { MigrationInterface, QueryRunner } from 'typeorm';

export class Sms1672154251329 implements MigrationInterface {
  name = 'Sms1672154251329';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "account" ADD "smsAccountSid" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD "smsAuthToken" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD "smsFrom" character varying`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "smsFrom"`);
    await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "smsAuthToken"`);
    await queryRunner.query(
      `ALTER TABLE "account" DROP COLUMN "smsAccountSid"`
    );
  }
}
