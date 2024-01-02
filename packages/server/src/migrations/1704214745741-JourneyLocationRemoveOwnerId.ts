import { MigrationInterface, QueryRunner } from "typeorm";

export class JourneyLocationRemoveOwnerId1704214745741 implements MigrationInterface {
    name = 'JourneyLocationRemoveOwnerId1704214745741'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "journey_location" DROP CONSTRAINT "FK_0d56cd50938957295bff8999dcf"`);
        await queryRunner.query(`ALTER TABLE "journey_location" DROP COLUMN "ownerId"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "journey_location" ADD "ownerId" uuid`);
        await queryRunner.query(`ALTER TABLE "journey_location" ADD CONSTRAINT "FK_0d56cd50938957295bff8999dcf" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
