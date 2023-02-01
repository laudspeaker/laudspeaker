import { Integration } from './entities/integration.entity';
import { Process, Processor } from '@nestjs/bull';
import handleDatabricks from './databricks.worker';
import {
  Database,
  DBType,
  FrequencyUnit,
} from '../../api/integrations/entities/database.entity';
import { Job } from 'bull';
import { Account } from '../accounts/entities/accounts.entity';
import { InjectModel } from '@nestjs/mongoose';
import {
  Customer,
  CustomerDocument,
} from '../customers/schemas/customer.schema';
import { Model } from 'mongoose';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Pool } from 'pg';
import Cursor from 'pg-cursor';

const hourMs = 60 * 60 * 1000;
const dayMs = 24 * hourMs;
const weekMs = 7 * dayMs;
const monthMs = 30 * dayMs;
const yearMs = 365 * dayMs;

const frequencyUnitToMsMap: Record<FrequencyUnit, number> = {
  [FrequencyUnit.HOUR]: hourMs,
  [FrequencyUnit.DAY]: dayMs,
  [FrequencyUnit.WEEK]: weekMs,
  [FrequencyUnit.MONTH]: monthMs,
  [FrequencyUnit.YEAR]: yearMs,
};

const BATCH_SiZE = 10_000_000;

@Processor('integrations')
export class IntegrationsProcessor {
  constructor(
    @InjectModel(Customer.name)
    private customerModel: Model<CustomerDocument>,
    @InjectRepository(Database)
    private databasesRepository: Repository<Database>
  ) {}

  private databasesMap: Record<
    DBType,
    (database: Database, owner: Account) => Promise<void>
  > = {
    [DBType.DATABRICKS]: async (database, owner) => {
      await handleDatabricks(database, owner);
    },
    [DBType.POSTGRESQL]: async (database, owner) => {
      await this.handlePostgreSQLSync(database, owner);
    },
  };

  @Process('db')
  async handleDatabaseSync(job: Job<{ integration: Integration }>) {
    const integration = job.data.integration;
    if (!integration || !integration.database)
      throw new Error('Wrong integration was passed to job');

    // const { frequencyUnit, frequencyNumber, lastSync } = integration.database;
    // const syncTime =
    //   new Date(lastSync).getTime() +
    //   frequencyNumber * frequencyUnitToMsMap[frequencyUnit];

    // if (new Date(syncTime) > new Date()) return;

    await this.databasesMap[integration.database.dbType](
      integration.database,
      integration.owner
    );

    await this.databasesRepository.save({
      id: integration.database.id,
      lastSync: new Date().toUTCString(),
    });
  }

  async handlePostgreSQLSync(database: Database, owner: Account) {
    const pool = new Pool({
      connectionString: database.connectionString,
    });
    const pgClient = await pool.connect();
    const cursor = pgClient.query(new Cursor(database.query));

    let lastReadLength = Infinity;
    while (lastReadLength !== 0) {
      const customers = await cursor.read(BATCH_SiZE);

      for (const customer of customers) {
        if (!customer.id) continue;
        const customerInDb = await this.customerModel
          .findOne({ postgresqlId: customer.id, ownerId: owner.id })
          .exec();

        if (customerInDb) {
          for (const key of Object.keys(customer)) {
            if (key === 'id') continue;

            customerInDb[key] = customer[key];
          }
          await customerInDb.save();
        } else {
          await this.customerModel.create({
            ...customer,
            ownerId: owner.id,
            id: undefined,
            postgresqlId: customer.id,
          });
        }
      }

      lastReadLength = customers.length;
    }

    await cursor.close();
    pgClient.release();
    await pool.end();
  }
}
