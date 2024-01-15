import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveOwnerFromTemplate1703846495279
  implements MigrationInterface
{
  name = 'RemoveOwnerFromTemplate1703846495279';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "template" DROP CONSTRAINT "FK_80db6b8ce3fa9e4828f3cafe5b2"`
    );
    await queryRunner.query(`ALTER TABLE "template" DROP COLUMN "ownerId"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "template" ADD "ownerId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "template" ADD CONSTRAINT "FK_80db6b8ce3fa9e4828f3cafe5b2" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }
}
