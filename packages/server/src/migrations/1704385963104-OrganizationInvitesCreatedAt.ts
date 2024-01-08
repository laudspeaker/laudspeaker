import { MigrationInterface, QueryRunner } from 'typeorm';

export class OrganizationInvitesCreatedAt1704385963104
  implements MigrationInterface
{
  name = 'OrganizationInvitesCreatedAt1704385963104';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organization_invites" ADD "createdAt" TIMESTAMP NOT NULL DEFAULT now()`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "organization_invites" DROP COLUMN "createdAt"`
    );
  }
}
