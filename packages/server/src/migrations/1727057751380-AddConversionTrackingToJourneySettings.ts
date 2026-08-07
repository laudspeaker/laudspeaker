import { MigrationInterface, QueryRunner } from "typeorm"

export class AddConversionTrackingToJourneySettings1727057751380 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const query = `
    UPDATE journey
    SET "journeySettings" = jsonb_set(
      "journeySettings",
      '{conversionTracking}',
      '{"events": [],"enabled": false,"timeLimit":{"unit": "Days","value": 3}}')
    `;

    await queryRunner.query(query);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }
}
