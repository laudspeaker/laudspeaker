/* eslint-disable no-case-declarations */
import { AppDataSource } from '@/data-source';
import { DBSQLClient } from '@databricks/sql';
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

    await AppDataSource.manager.transaction(async (transactionManager) => {
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
      });
      const integration = await transactionManager.save(Integration, {
        name,
        description,
        owner: account,
        type: IntegrationType.DATABASE,
        database,
      });

      this.handleIntegration(integration);
    });
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
    const integration = await this.integrationsRepository.findOne({
      where: {
        id,
        owner: { id: account.id },
      },
    });

    integration.status = IntegrationStatus.PAUSED;
    await integration.save();
  }

  public async resumeIntegration(user: Express.User, id: string) {
    const account = await this.accountsService.findOne(user);
    const integration = await this.integrationsRepository.findOne({
      where: {
        id,
        owner: { id: account.id },
      },
    });

    integration.status = IntegrationStatus.ACTIVE;
    await integration.save();
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
        break;
      default:
        break;
    }
  }

  public async handleIntegration(integration: Integration) {
    try {
      await this.integrationsMap[integration.type](integration);
    } catch (e) {
      if (e instanceof Error) {
        await this.integrationsRepository.save({
          id: integration.id,
          status: IntegrationStatus.FAILED,
          errorMessage: e.message,
        });
      }
    }
  }
}
