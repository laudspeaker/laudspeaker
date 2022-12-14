import { MigrationInterface, QueryRunner } from "typeorm";

export class ManyToOneWorkflow1671011243279 implements MigrationInterface {
    name = 'ManyToOneWorkflow1671011243279'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workflow" ADD "segmentId" uuid`);
        await queryRunner.query(`ALTER TABLE "workflow" ADD CONSTRAINT "FK_87763c043e247cf8b9dec68beae" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "workflow" DROP CONSTRAINT "FK_87763c043e247cf8b9dec68beae"`);
        await queryRunner.query(`ALTER TABLE "workflow" DROP COLUMN "segmentId"`);
    }

}
