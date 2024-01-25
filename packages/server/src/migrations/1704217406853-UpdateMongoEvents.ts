import { EventKeysSchema } from '@/api/events/schemas/event-keys.schema';
import { EventSchema } from '@/api/events/schemas/event.schema';
import { formatMongoConnectionString } from '@/app.module';
import mongoose from 'mongoose';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateMongoEvents1704217406853 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    const mg = await mongoose.connect(
      formatMongoConnectionString(process.env.MONGOOSE_URL)
      // process.env.MONGOOSE_URL
    );

    await mg.connection.db.admin().command({
      setParameter: 1,
      maxTransactionLockRequestTimeoutMillis: 3000,
    });

    const session = await mg.startSession();
    session.startTransaction();

    try {
      const eventModel = mg.model('events', EventSchema);
      const eventKeysModel = mg.model('eventkeys', EventKeysSchema);

      const uniqueValuesEvents = await eventModel
        .aggregate(
          [
            { $match: { ownerId: { $ne: null, $exists: true } } },
            { $group: { _id: '$ownerId' } },
          ],
          { allowDiskUse: true }
        )
        .session(session);

      const uniqueValuesEventKeys = await eventKeysModel
        .aggregate(
          [
            { $match: { ownerId: { $ne: null, $exists: true } } },
            { $group: { _id: '$ownerId' } },
          ],
          { allowDiskUse: true }
        )
        .session(session);

      const ownerIdsEvents = uniqueValuesEvents.map((u) => u._id);
      const ownerIdsEventKeys = uniqueValuesEventKeys.map((u) => u._id);
      const placeholders = [...ownerIdsEvents, ...ownerIdsEventKeys]
        .map((_, index) => `$${index + 1}`)
        .join(', ');

      if ([...ownerIdsEvents, ...ownerIdsEventKeys].length) {
        const workspaces = await queryRunner.query(
          `SELECT w."id" AS workspace_id, o."ownerId" FROM "organization" o
                       JOIN "workspaces" w ON o."id" = w."organizationId"
                       WHERE o."ownerId" IN (${placeholders})`,
          [...ownerIdsEvents, ...ownerIdsEventKeys]
        );

        const workspaceMap = new Map(
          workspaces.map((ws) => [ws.ownerId, ws.workspace_id])
        );

        const uniqueSet = Array.from(
          new Set([...ownerIdsEvents, ...ownerIdsEventKeys])
        );

        for (const ownerId of uniqueSet) {
          const workspaceId = workspaceMap.get(ownerId);
          if (workspaceId) {
            await eventModel.updateMany(
              { ownerId },
              { $set: { workspaceId } },
              { session }
            );
            await eventKeysModel.updateMany(
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
