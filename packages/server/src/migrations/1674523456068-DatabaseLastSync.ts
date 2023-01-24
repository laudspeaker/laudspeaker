import { MigrationInterface, QueryRunner } from 'typeorm';

export class DatabaseLastSync1674523456068 implements MigrationInterface {
  name = 'DatabaseLastSync1674523456068';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "database" ADD "lastSync" character varying NOT NULL DEFAULT 'Tue, 24 Jan 2023 01:24:22 GMT'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "database" DROP COLUMN "lastSync"`);
  }
}

