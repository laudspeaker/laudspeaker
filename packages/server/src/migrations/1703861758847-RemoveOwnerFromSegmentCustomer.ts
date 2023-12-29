import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveOwnerFromSegmentCustomer1703861758847 implements MigrationInterface {
    name = 'RemoveOwnerFromSegmentCustomer1703861758847'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "segment_customers" DROP CONSTRAINT "FK_9d7b2e0647ac5576473dc820421"`);
        await queryRunner.query(`ALTER TABLE "segment_customers" DROP COLUMN "ownerId"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "segment_customers" ADD "ownerId" uuid`);
        await queryRunner.query(`ALTER TABLE "segment_customers" ADD CONSTRAINT "FK_9d7b2e0647ac5576473dc820421" FOREIGN KEY ("ownerId") REFERENCES "account"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
