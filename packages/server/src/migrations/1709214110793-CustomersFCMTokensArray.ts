import { CustomerSchema } from '@/api/customers/schemas/customer.schema';
import { formatMongoConnectionString } from '@/app.module';
import mongoose from 'mongoose';
import { MigrationInterface, QueryRunner } from 'typeorm';

export class CustomersFCMTokensArray1709214110793
  implements MigrationInterface
{
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
      const customerModel = mg.model('customers', CustomerSchema);

      for await (const customer of customerModel.find().cursor()) {
        if (!customer.androidFCMTokens) customer.androidFCMTokens = [];
        if (!customer.iosFCMTokens) customer.iosFCMTokens = [];
        if (!customer.previousAnonymousIds) customer.previousAnonymousIds = [];

        if (
          customer.androidDeviceToken &&
          !customer.androidFCMTokens.includes(customer.androidDeviceToken)
        ) {
          customer.androidFCMTokens.push(customer.androidDeviceToken);
        }

        if (
          customer.iosDeviceToken &&
          !customer.iosFCMTokens.includes(customer.iosDeviceToken)
        ) {
          customer.iosFCMTokens.push(customer.iosDeviceToken);
        }

        await customer.save({ session });
        await customer.updateOne(
          {
            $unset: {
              androidDeviceToken: '',
              iosDeviceToken: '',
            },
          },
          { session }
        );
      }

      await session.commitTransaction();
    } catch (e) {
      await session.abortTransaction();
      throw e;
    } finally {
      session.endSession();
      await mg.disconnect();
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {}
}
