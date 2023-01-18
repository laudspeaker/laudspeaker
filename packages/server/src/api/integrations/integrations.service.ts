/* eslint-disable no-case-declarations */
import { AppDataSource } from '@/data-source';
import { DBSQLClient } from '@databricks/sql';
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { AccountsService } from '../accounts/accounts.service';
import { CreateDBDto } from './dto/create-db.dto';
import { UpdateDBDto } from './dto/update-db.dto';
import { Database, DBType } from './entities/database.entity';
import { Integration, IntegrationType } from './entities/integration.entity';

@Injectable()
export class IntegrationsService {
  constructor(
    private accountsService: AccountsService,
    @InjectRepository(Integration)
    private integrationRepository: Repository<Integration>,
    @InjectRepository(Database)
    private databaseRepository: Repository<Database>
  ) {}

  public async getAllIntegrations(user: Express.User) {
    const databases = await this.getAllDatabases(user);

    return { databases };
  }

  public async getAllDatabases(user: Express.User) {
    const account = await this.accountsService.findOne(user);

    const integrations = await this.integrationRepository.find({
      where: { owner: { id: account.id }, type: IntegrationType.DATABASE },
      relations: ['database'],
    });

    return integrations.map((integration) => ({
      ...integration.database,
      name: integration.name,
      description: integration.description,
      id: integration.id,
    }));
  }

  public async getOneDatabase(user: Express.User, id: string) {
    const account = await this.accountsService.findOne(user);

    console.log({
      id,
      owner: { id: account.id },
      type: IntegrationType.DATABASE,
    });

    const integration = await this.integrationRepository.findOne({
      where: { id, owner: { id: account.id }, type: IntegrationType.DATABASE },
      relations: ['database'],
    });

    if (!integration) throw new NotFoundException('Integration not found');

    return {
      ...integration.database,
      name: integration.name,
      description: integration.description,
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
      syncToASegment,
    } = dbProperties;

    await AppDataSource.manager.transaction(async (transactionManager) => {
      const database = await transactionManager.save(Database, {
        connectionString,
        dbType,
        frequencyNumber,
        frequencyUnit,
        peopleIdentification,
        query,
        syncToASegment,
        databricksHost: databricksData.host,
        databricksPath: databricksData.path,
        databricksToken: databricksData.token,
      });
      await transactionManager.save(Integration, {
        name,
        description,
        owner: account,
        type: IntegrationType.DATABASE,
        database,
      });
    });
  }

  public async updateDatabase(
    user: Express.User,
    updateDBDto: UpdateDBDto,
    id: string
  ) {
    const account = await this.accountsService.findOne(user);
    const integration = await this.integrationRepository.findOne({
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
      syncToASegment,
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
        syncToASegment,
        databricksHost: databricksData.host,
        databricksPath: databricksData.path,
        databricksToken: databricksData.token,
      });
      await transactionManager.save(Integration, { id, name, description });
    });
  }

  public async deleteIntegration(user: Express.User, id: string) {
    const account = await this.accountsService.findOne(user);
    const integration = await this.integrationRepository.findOne({
      where: {
        id,
        owner: { id: account.id },
      },
    });

    if (!integration) return new NotFoundException('Integration not found');

    await integration.remove();
  }

  public async reviewDB(createDBDto: CreateDBDto) {
    switch (createDBDto.dbType) {
      case DBType.DATABRICKS:
        const client = new DBSQLClient({});
        await client.connect({
          token: createDBDto.databricksData.token || '',
          host: createDBDto.databricksData.host || '',
          path: createDBDto.databricksData.path || '',
        });
        const session = await client.openSession();

        let limittedQuery = createDBDto.query.replace(';', ' LIMIT 10;');

        if (!limittedQuery.includes('LIMIT 10')) limittedQuery += ' LIMIT 10;';

        const queryOperation = await session.executeStatement(limittedQuery, {
          runAsync: true,
          maxRows: 10,
        });

        const result = await queryOperation.fetchAll({
          progress: false,
        });
        await queryOperation.close();

        return result;
      case DBType.POSTGRESQL:
        break;
      default:
        break;
    }
  }
}
