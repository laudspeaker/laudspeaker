import { MigrationInterface, QueryRunner } from "typeorm";

export class WorkspaceIdWithPk1704189041317 implements MigrationInterface {
    name = 'WorkspaceIdWithPk1704189041317'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "requeue" DROP CONSTRAINT "PK_3bbb63d1d84962e9f6ce1c5dce9"`);
        await queryRunner.query(`ALTER TABLE "requeue" ADD CONSTRAINT "PK_289cdd885e77924090659937bdf" PRIMARY KEY ("customerId", "workspaceId", "ownerId", "stepId")`);
        await queryRunner.query(`ALTER TABLE "requeue" DROP CONSTRAINT "FK_b0ec93726c20521784a8044705a"`);
        await queryRunner.query(`ALTER TABLE "requeue" ALTER COLUMN "workspaceId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "requeue" ADD CONSTRAINT "FK_b0ec93726c20521784a8044705a" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "requeue" DROP CONSTRAINT "FK_b0ec93726c20521784a8044705a"`);
        await queryRunner.query(`ALTER TABLE "requeue" ALTER COLUMN "workspaceId" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "requeue" ADD CONSTRAINT "FK_b0ec93726c20521784a8044705a" FOREIGN KEY ("workspaceId") REFERENCES "workspaces"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "requeue" DROP CONSTRAINT "PK_289cdd885e77924090659937bdf"`);
        await queryRunner.query(`ALTER TABLE "requeue" ADD CONSTRAINT "PK_3bbb63d1d84962e9f6ce1c5dce9" PRIMARY KEY ("ownerId", "stepId", "customerId")`);
    }

}
