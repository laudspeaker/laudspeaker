import { MigrationInterface, QueryRunner } from 'typeorm';

export class ResendSigningSecret1705318240610 implements MigrationInterface {
  name = 'ResendSigningSecret1705318240610';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workspaces" ADD "resendSigningSecret" character varying`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workspaces" DROP COLUMN "resendSigningSecret"`
    );
  }
}
