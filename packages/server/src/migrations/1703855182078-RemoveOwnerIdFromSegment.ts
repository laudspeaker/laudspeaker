import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveOwnerIdFromSegment1703855182078 implements MigrationInterface {
    name = 'RemoveOwnerIdFromSegment1703855182078'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "segment" DROP CONSTRAINT "FK_bd1ff440a596fb609ceabf9ee12"`);
        await queryRunner.query(`ALTER TABLE "segment" DROP COLUMN "ownerId"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "segment" ADD "ownerId" uuid`);
        await queryRunner.query(`ALTER TABLE "segment" ADD CONSTRAINT "FK_bd1ff440a596fb609ceabf9ee12" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
