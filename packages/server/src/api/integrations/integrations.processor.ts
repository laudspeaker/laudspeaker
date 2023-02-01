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
      // TODO
    },
  };

  @Process('db')
  async handleDatabaseSync(job: Job<{ integration: Integration }>) {
    const integration = job.data.integration;
    if (!integration || !integration.database)
      throw new Error('Wrong integration was passed to job');

    const { frequencyUnit, frequencyNumber, lastSync } = integration.database;
    const syncTime =
      new Date(lastSync).getTime() +
      frequencyNumber * frequencyUnitToMsMap[frequencyUnit];

    if (new Date(syncTime) > new Date()) return;

    await this.databasesMap[integration.database.dbType](
      integration.database,
      integration.owner
    );

    await this.databasesRepository.save({
      id: integration.database.id,
      lastSync: new Date().toUTCString(),
    });
  }

  async handlePostgreSQLSync(database: Database) {
    // TODO
  }
}
