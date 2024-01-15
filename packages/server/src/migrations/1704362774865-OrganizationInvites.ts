import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrganizationInvites1704362774865 implements MigrationInterface {
  name = 'OrganizationInvites1704362774865';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "organization_invites" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "email" character varying NOT NULL, "organizationId" uuid, "teamId" uuid, CONSTRAINT "PK_e0799bee14bf23b82851d55fd05" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "organization_invites" ADD CONSTRAINT "FK_5b22f35fe54460ca118306d2cd1" FOREIGN KEY ("organizationId") REFERENCES "organization"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "organization_invites" ADD CONSTRAINT "FK_fd345d8b39082c1baa33b79f7e0" FOREIGN KEY ("teamId") REFERENCES "organization_team"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organization_invites" DROP CONSTRAINT "FK_fd345d8b39082c1baa33b79f7e0"`
    );
    await queryRunner.query(
      `ALTER TABLE "organization_invites" DROP CONSTRAINT "FK_5b22f35fe54460ca118306d2cd1"`
    );
    await queryRunner.query(`DROP TABLE "organization_invites"`);
  }
}
