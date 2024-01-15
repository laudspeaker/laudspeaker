import { MigrationInterface, QueryRunner } from 'typeorm';

export class ResendChannel1705316440308 implements MigrationInterface {
  name = 'ResendChannel1705316440308';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workspaces" ADD "resendSendingDomain" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces" ADD "resendAPIKey" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces" ADD "resendSendingName" character varying`
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces" ADD "resendSendingEmail" character varying`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workspaces" DROP COLUMN "resendSendingEmail"`
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces" DROP COLUMN "resendSendingName"`
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces" DROP COLUMN "resendAPIKey"`
    );
    await queryRunner.query(
      `ALTER TABLE "workspaces" DROP COLUMN "resendSendingDomain"`
    );
  }
}
