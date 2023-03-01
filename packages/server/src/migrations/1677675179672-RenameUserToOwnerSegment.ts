import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameUserToOwnerSegment1677675179672 implements MigrationInterface {
    name = 'RenameUserToOwnerSegment1677675179672'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "segment" DROP CONSTRAINT "FK_efe7ce4e85c90aba0882bde0f46"`);
        await queryRunner.query(`ALTER TABLE "segment" RENAME COLUMN "userId" TO "ownerId"`);
        await queryRunner.query(`ALTER TABLE "segment" ADD CONSTRAINT "FK_bd1ff440a596fb609ceabf9ee12" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "segment" DROP CONSTRAINT "FK_bd1ff440a596fb609ceabf9ee12"`);
        await queryRunner.query(`ALTER TABLE "segment" RENAME COLUMN "ownerId" TO "userId"`);
        await queryRunner.query(`ALTER TABLE "segment" ADD CONSTRAINT "FK_efe7ce4e85c90aba0882bde0f46" FOREIGN KEY ("userId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
