import { MigrationInterface, QueryRunner } from 'typeorm';

export class isDisabled1666959845965 implements MigrationInterface {
  name = 'isDisabled1666959845965';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workflow" ADD "isDeleted" boolean NOT NULL DEFAULT false`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "workflow" DROP COLUMN "isDeleted"`);
  }
}
