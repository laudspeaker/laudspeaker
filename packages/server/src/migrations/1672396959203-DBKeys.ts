import { MigrationInterface, QueryRunner } from 'typeorm';

export class DBKeys1672396959203 implements MigrationInterface {
  name = 'DBKeys1672396959203';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "audience" DROP COLUMN "ownerId"`);
    await queryRunner.query(`ALTER TABLE "audience" ADD "ownerId" integer`);
    await queryRunner.query(
      `ALTER TABLE "verification" DROP COLUMN "accountId"`
    );
    await queryRunner.query(
      `ALTER TABLE "verification" ADD "accountId" integer`
    );
    await queryRunner.query(`ALTER TABLE "workflow" DROP COLUMN "ownerId"`);
    await queryRunner.query(`ALTER TABLE "workflow" ADD "ownerId" integer`);
    await queryRunner.query(`ALTER TABLE "segment" DROP COLUMN "userId"`);
    await queryRunner.query(`ALTER TABLE "segment" ADD "userId" integer`);
    await queryRunner.query(
      `ALTER TABLE "sendgrid_event" DROP COLUMN "audienceId"`
    );
    await queryRunner.query(
      `ALTER TABLE "sendgrid_event" ADD "audienceId" uuid`
    );
    await queryRunner.query(`ALTER TABLE "template" DROP COLUMN "ownerId"`);
    await queryRunner.query(`ALTER TABLE "template" ADD "ownerId" integer`);
    await queryRunner.query(
      `ALTER TABLE "audience" ADD CONSTRAINT "FK_fad0b8178069609743d39acd5b2" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "verification" ADD CONSTRAINT "FK_8294798fe96e8ecdae281a1bda0" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" ADD CONSTRAINT "FK_c461fa8943da816b559047e6822" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "segment" ADD CONSTRAINT "FK_efe7ce4e85c90aba0882bde0f46" FOREIGN KEY ("userId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "sendgrid_event" ADD CONSTRAINT "FK_dd6c330ecb13899780068726d77" FOREIGN KEY ("audienceId") REFERENCES "audience"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "template" ADD CONSTRAINT "FK_80db6b8ce3fa9e4828f3cafe5b2" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "template" DROP CONSTRAINT "FK_80db6b8ce3fa9e4828f3cafe5b2"`
    );
    await queryRunner.query(
      `ALTER TABLE "sendgrid_event" DROP CONSTRAINT "FK_dd6c330ecb13899780068726d77"`
    );
    await queryRunner.query(
      `ALTER TABLE "segment" DROP CONSTRAINT "FK_efe7ce4e85c90aba0882bde0f46"`
    );
    await queryRunner.query(
      `ALTER TABLE "workflow" DROP CONSTRAINT "FK_c461fa8943da816b559047e6822"`
    );
    await queryRunner.query(
      `ALTER TABLE "verification" DROP CONSTRAINT "FK_8294798fe96e8ecdae281a1bda0"`
    );
    await queryRunner.query(
      `ALTER TABLE "audience" DROP CONSTRAINT "FK_fad0b8178069609743d39acd5b2"`
    );
    await queryRunner.query(`ALTER TABLE "template" DROP COLUMN "ownerId"`);
    await queryRunner.query(
      `ALTER TABLE "template" ADD "ownerId" character varying NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "sendgrid_event" DROP COLUMN "audienceId"`
    );
    await queryRunner.query(
      `ALTER TABLE "sendgrid_event" ADD "audienceId" character varying NOT NULL`
    );
    await queryRunner.query(`ALTER TABLE "segment" DROP COLUMN "userId"`);
    await queryRunner.query(
      `ALTER TABLE "segment" ADD "userId" character varying NOT NULL`
    );
    await queryRunner.query(`ALTER TABLE "workflow" DROP COLUMN "ownerId"`);
    await queryRunner.query(
      `ALTER TABLE "workflow" ADD "ownerId" character varying NOT NULL`
    );
    await queryRunner.query(
      `ALTER TABLE "verification" DROP COLUMN "accountId"`
    );
    await queryRunner.query(
      `ALTER TABLE "verification" ADD "accountId" character varying NOT NULL`
    );
    await queryRunner.query(`ALTER TABLE "audience" DROP COLUMN "ownerId"`);
    await queryRunner.query(
      `ALTER TABLE "audience" ADD "ownerId" character varying NOT NULL`
    );
  }
}
