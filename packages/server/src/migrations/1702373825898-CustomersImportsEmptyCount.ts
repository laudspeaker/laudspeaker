import { MigrationInterface, QueryRunner } from 'typeorm';

export class CustomersImportsEmptyCount1702373825898
  implements MigrationInterface
{
  name = 'CustomersImportsEmptyCount1702373825898';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "imports" ADD "emptyCount" integer NOT NULL DEFAULT '0'`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "imports" DROP COLUMN "emptyCount"`);
  }
}
