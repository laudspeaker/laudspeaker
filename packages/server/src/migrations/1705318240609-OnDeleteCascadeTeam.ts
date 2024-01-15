import { MigrationInterface, QueryRunner } from 'typeorm';

export class OnDeleteCascadeTeam1705318240609 implements MigrationInterface {
  name = 'OnDeleteCascadeTeam1705318240609';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organization_team_members_account" DROP CONSTRAINT "FK_139a514a64819f527af3f33aae2"`
    );
    await queryRunner.query(
      `ALTER TABLE "organization_team_members_account" ADD CONSTRAINT "FK_139a514a64819f527af3f33aae2" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organization_team_members_account" DROP CONSTRAINT "FK_139a514a64819f527af3f33aae2"`
    );
    await queryRunner.query(
      `ALTER TABLE "organization_team_members_account" ADD CONSTRAINT "FK_139a514a64819f527af3f33aae2" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`
    );
  }
}
