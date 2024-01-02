/* eslint-disable no-case-declarations */
import { InjectQueue } from '@nestjs/bullmq';
import { Queue, QueueEvents } from 'bullmq';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { AccountsService } from '../accounts/accounts.service';
import { CreateDBDto } from './dto/create-db.dto';
import { UpdateDBDto } from './dto/update-db.dto';
import { Database, DBType } from './entities/database.entity';
import {
  Integration,
  IntegrationStatus,
  IntegrationType,
} from './entities/integration.entity';
import handleDatabricks from './databricks.worker';
import { Pool } from 'pg';
import Cursor from 'pg-cursor';
import handleMySql from './mysql.worker';

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);
  private queueEvents: QueueEvents;

  constructor(
    private AppDataSource: DataSource,
    private accountsService: AccountsService,
    @InjectRepository(Integration)
    private integrationsRepository: Repository<Integration>,
    @InjectRepository(Database)
    private databaseRepository: Repository<Database>,
    @InjectQueue('integrations') private readonly integrationsQueue: Queue
  ) {
    this.queueEvents = new QueueEvents('integrations', {
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
      },
    });
  }

  public integrationsMap: Record<
    IntegrationType,
    (integration: Integration) => Promise<void>
  > = {
    [IntegrationType.DATABASE]: async (integration) => {
      const job = await this.integrationsQueue.add('db', { integration });
      await job.waitUntilFinished(this.queueEvents);
    },
  };

  public async getAllIntegrations(user: Express.User, session: string) {
    const databases = await this.getAllDatabases(user, session);

    return { databases };
  }

  public async getAllDatabases(user: Express.User, session: string) {
    const account = await this.accountsService.findOne(user, session);

    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

    const integrations = await this.integrationsRepository.find({
      where: {
        workspace: { id: workspace.id },
        type: IntegrationType.DATABASE,
      },
      relations: ['database'],
    });

    return integrations.map((integration) => ({
      ...integration.database,
      name: integration.name,
      description: integration.description,
      id: integration.id,
      status: integration.status,
      errorMessage: integration.errorMessage,
    }));
  }

  public async getOneDatabase(user: Express.User, id: string, session: string) {
    const account = await this.accountsService.findOne(user, session);
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

    const integration = await this.integrationsRepository.findOne({
      where: {
        id,
        workspace: { id: workspace.id },
        type: IntegrationType.DATABASE,
      },
      relations: ['database'],
    });

    if (!integration) throw new NotFoundException('Integration not found');

    return {
      ...integration.database,
      name: integration.name,
      description: integration.description,
      status: integration.status,
      errorMessage: integration.errorMessage,
    };
  }

  public async createDatabase(
    user: Express.User,
    createDBDto: CreateDBDto,
    session
  ) {
    const account = await this.accountsService.findOne(user, session);

    const { name, description, ...dbProperties } = createDBDto;
    const {
      connectionString,
      databricksData,
      dbType,
      frequencyNumber,
      frequencyUnit,
      peopleIdentification,
      query,
    } = dbProperties;

    let integration: Integration;
    await this.AppDataSource.manager.transaction(async (transactionManager) => {
      integration = await transactionManager.save(Integration, {
        name,
        description,
        owner: account,
        type: IntegrationType.DATABASE,
      });

      const database = await transactionManager.save(Database, {
        connectionString,
        dbType,
        frequencyNumber,
        frequencyUnit,
        peopleIdentification,
        query,
        databricksHost: databricksData.host,
        databricksPath: databricksData.path,
        databricksToken: databricksData.token,
        integration,
      });

      integration = await transactionManager.save(Integration, {
        ...integration,
        database,
      });
    });

    this.handleIntegration(integration);
  }

  public async updateDatabase(
    user: Express.User,
    updateDBDto: UpdateDBDto,
    id: string,
    session: string
  ) {
    const account = await this.accountsService.findOne(user, session);
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

    const integration = await this.integrationsRepository.findOne({
      where: {
        id,
        workspace: { id: workspace.id },
        type: IntegrationType.DATABASE,
      },
      relations: ['database'],
    });

    if (!integration) return new NotFoundException('Integration not found');

    const { name, description, ...dbProperties } = updateDBDto;
    const {
      connectionString,
      databricksData,
      dbType,
      frequencyNumber,
      frequencyUnit,
      peopleIdentification,
      query,
    } = dbProperties;

    await this.AppDataSource.manager.transaction(async (transactionManager) => {
      await transactionManager.save(Database, {
        id: integration.database.id,
        connectionString,
        dbType,
        frequencyNumber,
        frequencyUnit,
        peopleIdentification,
        query,
        databricksHost: databricksData.host,
        databricksPath: databricksData.path,
        databricksToken: databricksData.token,
      });
      await transactionManager.save(Integration, {
        id,
        name,
        description,
        status:
          integration.status === IntegrationStatus.FAILED
            ? IntegrationStatus.ACTIVE
            : integration.status,
        errorMessage: null,
      });
    });
  }

  public async pauseIntegration(
    user: Express.User,
    id: string,
    session: string
  ) {
    const account = await this.accountsService.findOne(user, session);
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

    await this.integrationsRepository.update(
      {
        id,
        workspace: { id: workspace.id },
      },
      {
        status: IntegrationStatus.PAUSED,
      }
    );
  }

  public async resumeIntegration(
    user: Express.User,
    id: string,
    session: string
  ) {
    const account = await this.accountsService.findOne(user, session);
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

    await this.integrationsRepository.update(
      {
        id,
        workspace: { id: workspace.id },
      },
      {
        status: IntegrationStatus.ACTIVE,
      }
    );
  }

  public async deleteIntegration(user: Express.User, id: string, session) {
    const account = await this.accountsService.findOne(user, session);
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

    const integration = await this.integrationsRepository.findOne({
      where: {
        id,
        workspace: { id: workspace.id },
      },
    });

    if (!integration) return new NotFoundException('Integration not found');

    await integration.remove();
  }

  public async reviewDB(
    user: Express.User,
    createDBDto: CreateDBDto,
    session: string
  ) {
    const account = await this.accountsService.findOne(user, session);
    switch (createDBDto.dbType) {
      case DBType.DATABRICKS:
        try {
          const { host, path, token } = createDBDto.databricksData;
          const result = await handleDatabricks(
            {
              databricksHost: host,
              databricksPath: path,
              databricksToken: token,
              query: createDBDto.query,
            },
            account,
            true
          );
          return result;
        } catch (e) {
          throw new BadRequestException(
            'Something wrong with connection to databricks'
          );
        }

      case DBType.POSTGRESQL:
        try {
          const pool = new Pool({
            connectionString: createDBDto.connectionString,
          });
          const pgClient = await pool.connect();
          const cursor = pgClient.query(new Cursor(createDBDto.query));

          const result = await cursor.read(10);

          await cursor.close();
          pgClient.release();
          await pool.end();

          return result;
        } catch (e) {
          throw new BadRequestException(
            'Something wrong with connection to postgresql'
          );
        }
      case DBType.MYSQL:
        try {
          const result = handleMySql(
            {
              connectionString: createDBDto.connectionString,
              query: createDBDto.query,
            },
            account,
            true
          );
          return result;
        } catch (e) {
          throw new BadRequestException(
            'Something wrong with connection to mysql'
          );
        }

      default:
        throw new BadRequestException('Unknown db type');
    }
  }

  public async handleIntegration(integration: Integration) {
    try {
      await this.integrationsMap[integration.type](integration);
    } catch (e) {
      await this.integrationsRepository.save({
        id: integration.id,
        status: IntegrationStatus.FAILED,
        errorMessage: 'Error retrieving data for integration.',
      });
    }
  }
}
