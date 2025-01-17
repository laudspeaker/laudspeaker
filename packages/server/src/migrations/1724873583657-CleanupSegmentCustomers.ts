import { MigrationInterface, QueryRunner } from "typeorm";

export class CleanupSegmentCustomers1724873583657 implements MigrationInterface {
    name = 'CleanupSegmentCustomers1724873583657'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "segment_customers" DROP CONSTRAINT "FK_c29044bfd7fe0fad5793789e288"`);
        await queryRunner.query(`ALTER TABLE "segment_customers" DROP CONSTRAINT "FK_d3c2674d46610072d2d8b91f048"`);
        await queryRunner.query(`ALTER TABLE "segment_customers" DROP CONSTRAINT "PK_7ffc372c347886f5c43c6e81115"`);
        await queryRunner.query(`ALTER TABLE "segment_customers" DROP COLUMN "segmentId"`);
        await queryRunner.query(`ALTER TABLE "segment_customers" DROP COLUMN "workspaceId"`);
        await queryRunner.query(`ALTER TABLE "segment_customers" DROP COLUMN "customerId"`);
        await queryRunner.query(`ALTER TABLE "segment_customers" ADD "segment_id" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "segment_customers" ADD "customer_id" bigint NOT NULL`);
        await queryRunner.query(`ALTER TABLE "segment_customers" ADD CONSTRAINT "PK_1bd8e575c091b5244e4092d137b" PRIMARY KEY ("segment_id", "customer_id")`);
        await queryRunner.query(`ALTER TABLE "segment_customers" ADD "workspace_id" uuid`);
        await queryRunner.query(`ALTER TABLE "segment_customers" ADD CONSTRAINT "FK_eb1025f60108b402b6cb1d72b99" FOREIGN KEY ("segment_id") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "segment_customers" ADD CONSTRAINT "FK_68afa6461cf4fb7a19b48e86d30" FOREIGN KEY ("customer_id") REFERENCES "customers"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "segment_customers" ADD CONSTRAINT "FK_c1142fceb3c0262c9fa75fb9290" FOREIGN KEY ("workspace_id") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "segment_customers" DROP CONSTRAINT "FK_c1142fceb3c0262c9fa75fb9290"`);
        await queryRunner.query(`ALTER TABLE "segment_customers" DROP CONSTRAINT "FK_68afa6461cf4fb7a19b48e86d30"`);
        await queryRunner.query(`ALTER TABLE "segment_customers" DROP CONSTRAINT "FK_eb1025f60108b402b6cb1d72b99"`);
        await queryRunner.query(`ALTER TABLE "segment_customers" DROP COLUMN "workspace_id"`);
        await queryRunner.query(`ALTER TABLE "segment_customers" DROP CONSTRAINT "PK_1bd8e575c091b5244e4092d137b"`);
        await queryRunner.query(`ALTER TABLE "segment_customers" DROP COLUMN "customer_id"`);
        await queryRunner.query(`ALTER TABLE "segment_customers" DROP COLUMN "segment_id"`);
        await queryRunner.query(`ALTER TABLE "segment_customers" ADD "customerId" character varying NOT NULL`);
        await queryRunner.query(`ALTER TABLE "segment_customers" ADD "workspaceId" uuid`);
        await queryRunner.query(`ALTER TABLE "segment_customers" ADD "segmentId" uuid NOT NULL`);
        await queryRunner.query(`ALTER TABLE "segment_customers" ADD CONSTRAINT "PK_7ffc372c347886f5c43c6e81115" PRIMARY KEY ("segmentId", "customerId")`);
        await queryRunner.query(`ALTER TABLE "segment_customers" ADD CONSTRAINT "FK_d3c2674d46610072d2d8b91f048" FOREIGN KEY ("segmentId") REFERENCES "segment"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "segment_customers" ADD CONSTRAINT "FK_c29044bfd7fe0fad5793789e288" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
