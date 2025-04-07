import { MigrationInterface, QueryRunner } from "typeorm"

export class CreateVersionsForExistingJourneys1741601915005 implements MigrationInterface {

  public async up(queryRunner: QueryRunner): Promise<void> {
    const journeys = await queryRunner.query(
      `SELECT * FROM "journey"`
    );

    for(const journey of journeys) {
      // this.journeyVersionService.create(journey.id);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
  }

}
