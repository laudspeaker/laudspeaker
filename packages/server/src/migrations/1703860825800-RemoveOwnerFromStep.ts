import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveOwnerFromStep1703860825800 implements MigrationInterface {
  name = 'RemoveOwnerFromStep1703860825800';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "step" DROP CONSTRAINT "FK_b0968ed8d11d74167f7cc5d180a"`
    );
    await queryRunner.query(`ALTER TABLE "step" DROP COLUMN "ownerId"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "step" ADD "ownerId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "step" ADD CONSTRAINT "FK_b0968ed8d11d74167f7cc5d180a" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }
}
