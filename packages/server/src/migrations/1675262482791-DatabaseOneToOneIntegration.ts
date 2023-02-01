import { MigrationInterface, QueryRunner } from "typeorm";

export class DatabaseOneToOneIntegration1675262482791 implements MigrationInterface {
    name = 'DatabaseOneToOneIntegration1675262482791'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "database" ADD "integrationId" uuid`);
        await queryRunner.query(`ALTER TABLE "database" ADD CONSTRAINT "UQ_adb2540a7b3fc584b399b35f3b1" UNIQUE ("integrationId")`);
        await queryRunner.query(`ALTER TABLE "database" ADD CONSTRAINT "FK_adb2540a7b3fc584b399b35f3b1" FOREIGN KEY ("integrationId") REFERENCES "integration"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "database" DROP CONSTRAINT "FK_adb2540a7b3fc584b399b35f3b1"`);
        await queryRunner.query(`ALTER TABLE "database" DROP CONSTRAINT "UQ_adb2540a7b3fc584b399b35f3b1"`);
        await queryRunner.query(`ALTER TABLE "database" DROP COLUMN "integrationId"`);
    }

}
