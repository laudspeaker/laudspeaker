import { MigrationInterface, QueryRunner } from "typeorm";

export class CleanupJourneyLocation1724873583656 implements MigrationInterface {
    name = 'CleanupJourneyLocation1724873583656'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "journey_location" DROP CONSTRAINT "FK_7b9b00e04d8238e4f7139f04fe3"`);
        await queryRunner.query(`ALTER TABLE "journey_location" DROP CONSTRAINT "FK_5a674a171525bdba040d0896f1b"`);
        await queryRunner.query(`ALTER TABLE "journey_location" DROP CONSTRAINT "FK_601eb8f16a433436338373167dc"`);
        await queryRunner.query(`ALTER TABLE "journey_location" DROP CONSTRAINT "PK_2184442420ee498a92f3bab1b1f"`);
        await queryRunner.query(`ALTER TABLE "journey_location" DROP COLUMN "journeyId"`);
        await queryRunner.query(`ALTER TABLE "journey_location" DROP COLUMN "stepId"`);
        await queryRunner.query(`ALTER TABLE "journey_location" DROP COLUMN "workspaceId"`);
        await queryRunner.query(`ALTER TABLE "journey_location" DROP COLUMN "customer"`);
        await queryRunner.query(`ALTER TABLE "journey_location" ADD "journey_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "journey_location" ADD "customer_id" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "journey_location" ADD CONSTRAINT "PK_ccb6f56366731fb59ab930900d7" PRIMARY KEY ("journey_id", "customer_id")`);
        await queryRunner.query(`ALTER TABLE "journey_location" ADD "step_id" uuid`);
        await queryRunner.query(`ALTER TABLE "journey_location" ADD "workspace_id" uuid`);
        await queryRunner.query(`ALTER TABLE "journey_location" ADD CONSTRAINT "FK_6dd84d27b4e203a66b7aff45d9f" FOREIGN KEY ("journey_id") REFERENCES "journey"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "journey_location" ADD CONSTRAINT "FK_190c49d199d8c0cade64abc54bb" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "journey_location" ADD CONSTRAINT "FK_96fb114557669644999b3a58da3" FOREIGN KEY ("step_id") REFERENCES "step"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "journey_location" ADD CONSTRAINT "FK_65945df8ff379d8cb7b74d0d896" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "journey_location" DROP CONSTRAINT "FK_65945df8ff379d8cb7b74d0d896"`);
        await queryRunner.query(`ALTER TABLE "journey_location" DROP CONSTRAINT "FK_96fb114557669644999b3a58da3"`);
        await queryRunner.query(`ALTER TABLE "journey_location" DROP CONSTRAINT "FK_190c49d199d8c0cade64abc54bb"`);
        await queryRunner.query(`ALTER TABLE "journey_location" DROP CONSTRAINT "FK_6dd84d27b4e203a66b7aff45d9f"`);
        await queryRunner.query(`ALTER TABLE "journey_location" DROP COLUMN "workspace_id"`);
        await queryRunner.query(`ALTER TABLE "journey_location" DROP COLUMN "step_id"`);
        await queryRunner.query(`ALTER TABLE "journey_location" DROP CONSTRAINT "PK_ccb6f56366731fb59ab930900d7"`);
        await queryRunner.query(`ALTER TABLE "journey_location" DROP COLUMN "customer_id"`);
        await queryRunner.query(`ALTER TABLE "journey_location" DROP COLUMN "journey_id"`);
        await queryRunner.query(`ALTER TABLE "journey_location" ADD "customer" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "journey_location" ADD "workspaceId" uuid`);
        await queryRunner.query(`ALTER TABLE "journey_location" ADD "stepId" uuid`);
        await queryRunner.query(`ALTER TABLE "journey_location" ADD "journeyId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "journey_location" ADD CONSTRAINT "PK_2184442420ee498a92f3bab1b1f" PRIMARY KEY ("journeyId", "customer")`);
        await queryRunner.query(`ALTER TABLE "journey_location" ADD CONSTRAINT "FK_601eb8f16a433436338373167dc" FOREIGN KEY ("journeyId") REFERENCES "journey"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "journey_location" ADD CONSTRAINT "FK_5a674a171525bdba040d0896f1b" FOREIGN KEY ("stepId") REFERENCES "step"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "journey_location" ADD CONSTRAINT "FK_7b9b00e04d8238e4f7139f04fe3" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
