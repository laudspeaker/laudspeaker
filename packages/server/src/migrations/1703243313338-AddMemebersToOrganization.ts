import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMemebersToOrganization1703243313338 implements MigrationInterface {
    name = 'AddMemebersToOrganization1703243313338'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "organization_team_members_account" ("organizationTeamId" uuid NOT NULL, "accountId" uuid NOT NULL, CONSTRAINT "PK_bb8c1070d43049e5864c71ba32e" PRIMARY KEY ("organizationTeamId", "accountId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_798e9f27ef185022bb4dc69a9d" ON "organization_team_members_account" ("organizationTeamId") `);
        await queryRunner.query(`CREATE INDEX "IDX_139a514a64819f527af3f33aae" ON "organization_team_members_account" ("accountId") `);
        await queryRunner.query(`ALTER TABLE "organization_team_members_account" ADD CONSTRAINT "FK_798e9f27ef185022bb4dc69a9de" FOREIGN KEY ("organizationTeamId") REFERENCES "organization_team"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "organization_team_members_account" ADD CONSTRAINT "FK_139a514a64819f527af3f33aae2" FOREIGN KEY ("accountId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "organization_team_members_account" DROP CONSTRAINT "FK_139a514a64819f527af3f33aae2"`);
        await queryRunner.query(`ALTER TABLE "organization_team_members_account" DROP CONSTRAINT "FK_798e9f27ef185022bb4dc69a9de"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_139a514a64819f527af3f33aae"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_798e9f27ef185022bb4dc69a9d"`);
        await queryRunner.query(`DROP TABLE "organization_team_members_account"`);
    }

}
