import { MigrationInterface, QueryRunner } from 'typeorm';

export class NewJourney1686215537657 implements MigrationInterface {
  name = 'NewJourney1686215537657';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `CREATE TABLE "journey" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "name" character varying NOT NULL, "isActive" boolean NOT NULL DEFAULT false, "isPaused" boolean NOT NULL DEFAULT false, "isStopped" boolean NOT NULL DEFAULT false, "isDeleted" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "startedAt" TIMESTAMP, "deletedAt" TIMESTAMP, "stoppedAt" TIMESTAMP, "latestPause" TIMESTAMP, "latestSave" TIMESTAMP NOT NULL DEFAULT now(), "visualLayout" jsonb, "isDynamic" boolean NOT NULL DEFAULT true, "inclusionCriteria" jsonb NOT NULL DEFAULT '{"conditionalType":"and","conditions":[]}', "ownerId" uuid, CONSTRAINT "PK_0dfc23b6e61590ef493cf3adcde" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `CREATE TABLE "step" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "type" integer NOT NULL, "customers" text array NOT NULL DEFAULT '{}', "metadata" jsonb, "ownerId" uuid, "journeyId" uuid NOT NULL, CONSTRAINT "PK_70d386ace569c3d265e05db0cc7" PRIMARY KEY ("id"))`
    );
    await queryRunner.query(
      `ALTER TABLE "journey" ADD CONSTRAINT "FK_c1e4d2bbf7a6f39d5b6dc14dfdf" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "step" ADD CONSTRAINT "FK_b0968ed8d11d74167f7cc5d180a" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
    await queryRunner.query(
      `ALTER TABLE "step" ADD CONSTRAINT "FK_71d98b993ed2b9a22cc31a3a312" FOREIGN KEY ("journeyId") REFERENCES "journey"("id") ON DELETE CASCADE ON UPDATE NO ACTION`
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "step" DROP CONSTRAINT "FK_71d98b993ed2b9a22cc31a3a312"`
    );
    await queryRunner.query(
      `ALTER TABLE "step" DROP CONSTRAINT "FK_b0968ed8d11d74167f7cc5d180a"`
    );
    await queryRunner.query(
      `ALTER TABLE "journey" DROP CONSTRAINT "FK_c1e4d2bbf7a6f39d5b6dc14dfdf"`
    );
    await queryRunner.query(`DROP TABLE "step"`);
    await queryRunner.query(`DROP TABLE "journey"`);
  }
}
