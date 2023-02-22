import { MigrationInterface, QueryRunner } from 'typeorm';

export class FirebaseCredentials1677062841850 implements MigrationInterface {
  name = 'FirebaseCredentials1677062841850';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "account" ADD "firebaseCredentials" character varying`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "account" DROP COLUMN "firebaseCredentials"`
    );
  }
}
