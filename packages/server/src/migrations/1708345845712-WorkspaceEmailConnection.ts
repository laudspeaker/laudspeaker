import { MigrationInterface, QueryRunner } from 'typeorm';

export class WorkspaceEmailConnection1708345845712
  implements MigrationInterface
{
  name = 'WorkspaceEmailConnection1708345845712';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "workspace_email_connection" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "emailProvider" character varying NOT NULL, "sendingEmail" character varying NOT NULL, "sendingName" character varying NOT NULL, "workspaceId" uuid NOT NULL, CONSTRAINT "UQ_2a14013e7178648c64b11a14f55" UNIQUE ("workspaceId", "emailProvider", "sendingEmail", "sendingName"), CONSTRAINT "PK_e74919db48d888daa4e0332b028" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "workspace_email_connection" ADD CONSTRAINT "FK_0e109fbc042ff6164efdebd9001" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE CASCADE`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "workspace_email_connection" DROP CONSTRAINT "FK_0e109fbc042ff6164efdebd9001"`
    );
    await queryRunner.query(`DROP TABLE "workspace_email_connection"`);
  }
}
