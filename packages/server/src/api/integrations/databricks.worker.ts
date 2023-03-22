import { DBSQLClient } from '@databricks/sql';
import mongoose from 'mongoose';
import { isMainThread, workerData, Worker, parentPort } from 'worker_threads';
import { Account } from '../accounts/entities/accounts.entity';
import { CustomerSchema } from '../customers/schemas/customer.schema';

export interface DatabricksWorkerDatabase {
  databricksToken?: string;
  databricksHost?: string;
  databricksPath?: string;
  query: string;
}

const handleDatabricksSync = async (
  database: DatabricksWorkerDatabase,
  owner: Account,
  isReview: boolean
) => {
  const client = await new DBSQLClient({ logger: console }).connect({
    token: database.databricksToken,
    host: database.databricksHost,
    path: database.databricksPath,
  });
  const session = await client.openSession();

  if (isReview) {
    const queryOperation = await session.executeStatement(database.query, {
      runAsync: true,
      maxRows: 10,
    });

    const result = await queryOperation.fetchChunk({
      progress: false,
    });

    parentPort.postMessage(result);
    await queryOperation.close();
  } else {
    await mongoose.connect(process.env.MONGOOSE_URL);
    const customerModel = mongoose.model('customers', CustomerSchema);

    const queryOperation = await session.executeStatement(database.query, {
      runAsync: true,
      maxRows: 10_000_000,
    });

    let hasMoreRows = true;
    while (hasMoreRows) {
      const customers = (await queryOperation.fetchChunk({
        progress: false,
      })) as Record<string, any>[];

      for (const customer of customers) {
        if (!customer.id) continue;
        const customerInDb = await customerModel
          .findOne({ databricksId: customer.id, ownerId: owner.id })
          .exec();

        if (customerInDb) {
          for (const key of Object.keys(customer)) {
            if (key === 'id') continue;

            customerInDb[key] = customer[key];
          }
          await customerInDb.save();
        } else {
          await customerModel.create({
            ...customer,
            ownerId: owner.id,
            id: undefined,
            databricksId: customer.id,
          });
        }
      }

      hasMoreRows = await queryOperation.hasMoreRows();
    }

    parentPort.postMessage('success');

    await queryOperation.close();
  }

  await session.close();
  await client.close();
};

const handleDatabricks = (
  database: DatabricksWorkerDatabase,
  owner: Account,
  isReview = false
) => {
  return new Promise((resolve, reject) => {
    const worker = new Worker(__filename, {
      workerData: { database, owner, isReview },
    });

    worker.on('message', resolve);
    worker.on('error', reject);
    worker.on('exit', (code) => {
      if (code !== 0)
        reject(new Error(`Worker stopped with exit code ${code}`));
    });
  });
};

export default handleDatabricks;

if (!isMainThread) {
  const { database, owner, isReview } = workerData;
  handleDatabricksSync(database, owner, isReview);
}
