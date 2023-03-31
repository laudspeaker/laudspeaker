import { Account } from '../accounts/entities/accounts.entity';
import { isMainThread, workerData, Worker, parentPort } from 'worker_threads';
import mysql from 'mysql2';
import mongoose from 'mongoose';
import { CustomerSchema } from '../customers/schemas/customer.schema';

const handleMySqlSync = async (
  { connectionString, query }: { connectionString: string; query: string },
  owner: Account,
  isReview = false
) => {
  if (isReview) {
    const connection = mysql.createConnection(connectionString);

    const stream = connection.query(query).stream({ objectMode: true });

    const records = [];

    for await (const record of stream) {
      records.push(record);
      if (records.length === 10) {
        stream.destroy();
        break;
      }
    }
    connection.end();
    parentPort.postMessage(records);
  } else {
    console.log(connectionString, query);
    await mongoose.connect(process.env.MONGOOSE_URL);
    const customerModel = mongoose.model('customers', CustomerSchema);

    const connection = mysql.createConnection(connectionString);

    const stream = connection.query(query).stream({ objectMode: true });

    for await (const customer of stream) {
      if (!customer.id) continue;
      const customerInDb = await customerModel
        .findOne({ mysqlId: customer.id, ownerId: owner.id })
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
          mysqlId: customer.id,
        });
      }
    }

    parentPort.postMessage('success');
  }
};

const handleMySql = (
  database: { connectionString: string; query: string },
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

export default handleMySql;

if (!isMainThread) {
  const { database, owner, isReview } = workerData;
  handleMySqlSync(database, owner, isReview);
}
