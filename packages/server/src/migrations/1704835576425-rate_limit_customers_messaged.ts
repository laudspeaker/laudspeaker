import { MigrationInterface, QueryRunner } from 'typeorm';

export class RateLimitCustomersMessaged1704835576425
  implements MigrationInterface
{
  name = 'RateLimitCustomersMessaged1704835576425';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "journey_location" ADD "messageSent" boolean`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "journey_location" DROP COLUMN "messageSent"`
    );
  }
}
