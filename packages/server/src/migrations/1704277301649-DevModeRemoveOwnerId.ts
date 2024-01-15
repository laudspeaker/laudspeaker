import { MigrationInterface, QueryRunner } from 'typeorm';

export class DevModeRemoveOwnerId1704277301649 implements MigrationInterface {
  name = 'DevModeRemoveOwnerId1704277301649';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dev_mode" DROP CONSTRAINT "FK_7f48a0703c124884c02a8696be5"`
    );
    await queryRunner.query(
      `ALTER TABLE "dev_mode" DROP CONSTRAINT "PK_b73c33014d59aaf71e6bdefb54b"`
    );
    await queryRunner.query(
      `ALTER TABLE "dev_mode" ADD CONSTRAINT "PK_ea7d4dcacd5c829777682c6d550" PRIMARY KEY ("journeyId", "workspaceId")`
    );
    await queryRunner.query(`ALTER TABLE "dev_mode" DROP COLUMN "ownerId"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "dev_mode" ADD "ownerId" uuid NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "dev_mode" DROP CONSTRAINT "PK_ea7d4dcacd5c829777682c6d550"`
    );
    await queryRunner.query(
      `ALTER TABLE "dev_mode" ADD CONSTRAINT "PK_b73c33014d59aaf71e6bdefb54b" PRIMARY KEY ("ownerId", "journeyId", "workspaceId")`
    );
    await queryRunner.query(
      `ALTER TABLE "dev_mode" ADD CONSTRAINT "FK_7f48a0703c124884c02a8696be5" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }
}
