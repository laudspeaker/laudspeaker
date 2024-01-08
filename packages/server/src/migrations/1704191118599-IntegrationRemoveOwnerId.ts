import { MigrationInterface, QueryRunner } from 'typeorm';

export class IntegrationRemoveOwnerId1704191118599
  implements MigrationInterface
{
  name = 'IntegrationRemoveOwnerId1704191118599';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "integration" DROP CONSTRAINT "FK_f470dfd06183e7bfa12e4ed7d51"`
    );
    await queryRunner.query(`ALTER TABLE "integration" DROP COLUMN "ownerId"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "integration" ADD "ownerId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "integration" ADD CONSTRAINT "FK_f470dfd06183e7bfa12e4ed7d51" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }
}
