/* eslint-disable no-case-declarations */
import { AppDataSource } from '@/data-source';
import { InjectQueue } from '@nestjs/bull';
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Queue } from 'bull';
import { Repository } from 'typeorm';
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

@Injectable()
export class IntegrationsService {
  private readonly logger = new Logger(IntegrationsService.name);

  constructor(
    private accountsService: AccountsService,
    @InjectRepository(Integration)
    private integrationsRepository: Repository<Integration>,
    @InjectRepository(Database)
    private databaseRepository: Repository<Database>,
    @InjectQueue('integrations') private readonly integrationsQueue: Queue
  ) {}

  public integrationsMap: Record<
    IntegrationType,
    (integration: Integration) => Promise<void>
  > = {
    [IntegrationType.DATABASE]: async (integration) => {
      const job = await this.integrationsQueue.add('db', { integration });
      await job.finished();
    },
  };

  public async getAllIntegrations(user: Express.User) {
    const databases = await this.getAllDatabases(user);

    return { databases };
  }

  public async getAllDatabases(user: Express.User) {
    const account = await this.accountsService.findOne(user);

    const integrations = await this.integrationsRepository.find({
      where: { owner: { id: account.id }, type: IntegrationType.DATABASE },
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

  public async getOneDatabase(user: Express.User, id: string) {
    const account = await this.accountsService.findOne(user);

    const integration = await this.integrationsRepository.findOne({
      where: { id, owner: { id: account.id }, type: IntegrationType.DATABASE },
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

  public async createDatabase(user: Express.User, createDBDto: CreateDBDto) {
    const account = await this.accountsService.findOne(user);

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
    await AppDataSource.manager.transaction(async (transactionManager) => {
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
    id: string
  ) {
    const account = await this.accountsService.findOne(user);
    const integration = await this.integrationsRepository.findOne({
      where: {
        id,
        owner: { id: account.id },
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

    await AppDataSource.manager.transaction(async (transactionManager) => {
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

  public async pauseIntegration(user: Express.User, id: string) {
    const account = await this.accountsService.findOne(user);
    await this.integrationsRepository.update(
      {
        id,
        owner: { id: account.id },
      },
      {
        status: IntegrationStatus.PAUSED,
      }
    );
  }

  public async resumeIntegration(user: Express.User, id: string) {
    const account = await this.accountsService.findOne(user);
    await this.integrationsRepository.update(
      {
        id,
        owner: { id: account.id },
      },
      {
        status: IntegrationStatus.ACTIVE,
      }
    );
  }

  public async deleteIntegration(user: Express.User, id: string) {
    const account = await this.accountsService.findOne(user);
    const integration = await this.integrationsRepository.findOne({
      where: {
        id,
        owner: { id: account.id },
      },
    });

    if (!integration) return new NotFoundException('Integration not found');

    await integration.remove();
  }

  public async reviewDB(user: Express.User, createDBDto: CreateDBDto) {
    const account = await this.accountsService.findOne(user);
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
