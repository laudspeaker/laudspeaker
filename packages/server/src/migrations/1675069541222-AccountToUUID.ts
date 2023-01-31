import { MigrationInterface, QueryRunner } from 'typeorm';

export class AccountToUUID1675069541222 implements MigrationInterface {
  name = 'AccountToUUID1675069541222';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "job" DROP CONSTRAINT "FK_4230d15401eafcf6f4538208015"`
    );
    await queryRunner.query(
      `ALTER TABLE "segment" DROP CONSTRAINT "FK_efe7ce4e85c90aba0882bde0f46"`
    );
    await queryRunner.query(
      `ALTER TABLE "verification" DROP CONSTRAINT "FK_8294798fe96e8ecdae281a1bda0"`
    );
    await queryRunner.query(
      `ALTER TABLE "template" DROP CONSTRAINT "FK_80db6b8ce3fa9e4828f3cafe5b2"`
    );
    await queryRunner.query(
      `ALTER TABLE "audience" DROP CONSTRAINT "FK_fad0b8178069609743d39acd5b2"`
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" DROP CONSTRAINT "FK_c461fa8943da816b559047e6822"`
    );
    await queryRunner.query(
      `ALTER TABLE "account" DROP CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea"`
    );
    await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "id"`);
    await queryRunner.query(
      `ALTER TABLE "account" ADD "id" uuid NOT NULL DEFAULT uuid_generate_v4()`
    );
    await queryRunner.query(
      `ALTER TABLE "account" ADD CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id")`
    );
    await queryRunner.query(`ALTER TABLE "template" DROP COLUMN "ownerId"`);
    await queryRunner.query(`ALTER TABLE "template" ADD "ownerId" uuid`);
    await queryRunner.query(`ALTER TABLE "segment" DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "segment" ADD "userId" uuid`);
    await queryRunner.query(`ALTER TABLE "workflow" DROP COLUMN "ownerId"`);
    await queryRunner.query(`ALTER TABLE "workflow" ADD "ownerId" uuid`);
    await queryRunner.query(`ALTER TABLE "audience" DROP COLUMN "ownerId"`);
    await queryRunner.query(`ALTER TABLE "audience" ADD "ownerId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "verification" DROP COLUMN "accountId"`
    );
    await queryRunner.query(`ALTER TABLE "verification" ADD "accountId" uuid`);
    await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "ownerId"`);
    await queryRunner.query(`ALTER TABLE "job" ADD "ownerId" uuid`);
    await queryRunner.query(
      `ALTER TABLE "template" ADD CONSTRAINT "FK_80db6b8ce3fa9e4828f3cafe5b2" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "segment" ADD CONSTRAINT "FK_efe7ce4e85c90aba0882bde0f46" FOREIGN KEY ("userId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" ADD CONSTRAINT "FK_c461fa8943da816b559047e6822" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "audience" ADD CONSTRAINT "FK_fad0b8178069609743d39acd5b2" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "verification" ADD CONSTRAINT "FK_8294798fe96e8ecdae281a1bda0" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "job" ADD CONSTRAINT "FK_4230d15401eafcf6f4538208015" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "job" DROP CONSTRAINT "FK_4230d15401eafcf6f4538208015"`
    );
    await queryRunner.query(
      `ALTER TABLE "verification" DROP CONSTRAINT "FK_8294798fe96e8ecdae281a1bda0"`
    );
    await queryRunner.query(
      `ALTER TABLE "audience" DROP CONSTRAINT "FK_fad0b8178069609743d39acd5b2"`
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" DROP CONSTRAINT "FK_c461fa8943da816b559047e6822"`
    );
    await queryRunner.query(
      `ALTER TABLE "segment" DROP CONSTRAINT "FK_efe7ce4e85c90aba0882bde0f46"`
    );
    await queryRunner.query(
      `ALTER TABLE "template" DROP CONSTRAINT "FK_80db6b8ce3fa9e4828f3cafe5b2"`
    );
    await queryRunner.query(`ALTER TABLE "job" DROP COLUMN "ownerId"`);
    await queryRunner.query(`ALTER TABLE "job" ADD "ownerId" integer`);
    await queryRunner.query(
      `ALTER TABLE "verification" DROP COLUMN "accountId"`
    );
    await queryRunner.query(
      `ALTER TABLE "verification" ADD "accountId" integer`
    );
    await queryRunner.query(`ALTER TABLE "audience" DROP COLUMN "ownerId"`);
    await queryRunner.query(`ALTER TABLE "audience" ADD "ownerId" integer`);
    await queryRunner.query(`ALTER TABLE "workflow" DROP COLUMN "ownerId"`);
    await queryRunner.query(`ALTER TABLE "workflow" ADD "ownerId" integer`);
    await queryRunner.query(`ALTER TABLE "segment" DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "segment" ADD "userId" integer`);
    await queryRunner.query(`ALTER TABLE "template" DROP COLUMN "ownerId"`);
    await queryRunner.query(`ALTER TABLE "template" ADD "ownerId" integer`);
    await queryRunner.query(
      `ALTER TABLE "account" DROP CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea"`
    );
    await queryRunner.query(`ALTER TABLE "account" DROP COLUMN "id"`);
    await queryRunner.query(`ALTER TABLE "account" ADD "id" SERIAL NOT NULL`);
    await queryRunner.query(
      `ALTER TABLE "account" ADD CONSTRAINT "PK_54115ee388cdb6d86bb4bf5b2ea" PRIMARY KEY ("id")`
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" ADD CONSTRAINT "FK_c461fa8943da816b559047e6822" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "audience" ADD CONSTRAINT "FK_fad0b8178069609743d39acd5b2" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "template" ADD CONSTRAINT "FK_80db6b8ce3fa9e4828f3cafe5b2" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "verification" ADD CONSTRAINT "FK_8294798fe96e8ecdae281a1bda0" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "segment" ADD CONSTRAINT "FK_efe7ce4e85c90aba0882bde0f46" FOREIGN KEY ("userId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "job" ADD CONSTRAINT "FK_4230d15401eafcf6f4538208015" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }
}

