import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveJourneyOwnerId1703844300657 implements MigrationInterface {
  name = 'RemoveJourneyOwnerId1703844300657';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "journey" DROP CONSTRAINT "FK_c1e4d2bbf7a6f39d5b6dc14dfdf"`
    );
    await queryRunner.query(`ALTER TABLE "journey" DROP COLUMN "ownerId"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "journey" ADD "ownerId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "journey" ADD CONSTRAINT "FK_c1e4d2bbf7a6f39d5b6dc14dfdf" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }
}
