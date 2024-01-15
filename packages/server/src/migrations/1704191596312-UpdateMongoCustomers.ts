import { MigrationInterface, QueryRunner } from 'typeorm';
import mongoose from 'mongoose';
import {
  Customer,
  CustomerSchema,
} from '@/api/customers/schemas/customer.schema';
import {
  CustomerKeys,
  CustomerKeysSchema,
} from '@/api/customers/schemas/customer-keys.schema';
import { formatMongoConnectionString } from '@/app.module';

export class UpdateMongoCustomers1704191596312 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const mg = await mongoose.connect(
      formatMongoConnectionString(process.env.MONGOOSE_URL)
    );

    await mg.connection.db.admin().command({
      setParameter: 1,
      maxTransactionLockRequestTimeoutMillis: 3000,
    });

    const session = await mg.startSession();
    session.startTransaction();

    try {
      const customerModel = mg.model('customers', CustomerSchema);
      const customerKeysModel = mg.model('customerkeys', CustomerKeysSchema);

      const uniqueValues = await customerModel
        .aggregate(
          [
            { $match: { ownerId: { $ne: null, $exists: true } } },
            { $group: { _id: '$ownerId' } },
          ],
          { allowDiskUse: true }
        )
        .session(session);

      const ownerIds = uniqueValues.map((u) => u._id);
      const placeholders = ownerIds
        .map((_, index) => `$${index + 1}`)
        .join(', ');

      if (ownerIds.length) {
        const workspaces = await queryRunner.query(
          `SELECT w."id" AS workspace_id, o."ownerId" FROM "organization" o
         JOIN "workspaces" w ON o."id" = w."organizationId"
         WHERE o."ownerId" IN (${placeholders})`,
          ownerIds
        );

        const workspaceMap = new Map(
          workspaces.map((ws) => [ws.ownerId, ws.workspace_id])
        );

        for (const ownerId of ownerIds) {
          const workspaceId = workspaceMap.get(ownerId);
          if (workspaceId) {
            await customerModel.updateMany(
              { ownerId },
              { $set: { workspaceId } },
              { session }
            );
            await customerKeysModel.updateMany(
              { ownerId },
              { $set: { workspaceId } },
              { session }
            );
          }
        }
      }

      await session.commitTransaction();
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
      await mg.disconnect();
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
