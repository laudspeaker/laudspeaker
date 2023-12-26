import { BadRequestException, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { tryCatch } from 'bullmq';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { DataSource, Repository } from 'typeorm';
import { Logger } from 'winston';
import { Account } from '../accounts/entities/accounts.entity';
import { AuthHelper } from '../auth/auth.helper';
import { Workspaces } from '../workspaces/entities/workspaces.entity';
import { CreateOrganizationDTO } from './dto/create-ogranization.dto';
import { UpdateOrganizationDTO } from './dto/update-organization.dto';
import { OrganizationTeam } from './entities/organization-team.entity';
import { Organization } from './entities/organization.entity';

@Injectable()
export class OrganizationService {
  constructor(
    private dataSource: DataSource,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @InjectRepository(Organization)
    public journeysRepository: Repository<Organization>,
    @InjectRepository(Workspaces)
    public workspacesRepository: Repository<Workspaces>,
    @InjectRepository(OrganizationTeam)
    public organizationTeamRepository: Repository<OrganizationTeam>,
    @InjectRepository(Account)
    public accountRepository: Repository<Account>,
    @Inject(AuthHelper)
    public readonly authHelper: AuthHelper
  ) {}

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: OrganizationService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }
  debug(message, method, session, user = 'ANONYMOUS') {
    this.logger.debug(
      message,
      JSON.stringify({
        class: OrganizationService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }
  warn(message, method, session, user = 'ANONYMOUS') {
    this.logger.warn(
      message,
      JSON.stringify({
        class: OrganizationService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }
  error(error, method, session, user = 'ANONYMOUS') {
    this.logger.error(
      error.message,
      error.stack,
      JSON.stringify({
        class: OrganizationService.name,
        method: method,
        session: session,
        cause: error.cause,
        name: error.name,
        user: user,
      })
    );
  }
  verbose(message, method, session, user = 'ANONYMOUS') {
    this.logger.verbose(
      message,
      JSON.stringify({
        class: OrganizationService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  // Will need update on for multiple workspaces and organization management
  public async update(
    account: Account,
    body: UpdateOrganizationDTO,
    session: string
  ) {
    const queryRunner = await this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      await queryRunner.manager.update(
        Organization,
        {
          id: account?.teams?.[0]?.organization.id,
        },
        {
          companyName: body.name,
        }
      );

      await queryRunner.manager.update(
        Workspaces,
        {
          id: account?.teams?.[0]?.organization?.workspaces?.[0]?.id,
        },
        {
          timezoneUTCOffset: body.timezoneUTCOffset,
        }
      );

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.error(err, this.update, session, account.id);
    }
  }

  // Will need update on for multiple workspaces and organization management
  public async create(
    account: Account,
    body: CreateOrganizationDTO,
    session: string
  ) {
    if (!!account?.teams?.[0]?.organization?.workspaces?.[0]) {
      throw new BadRequestException('You have already setup organization');
    }

    const queryRunner = await this.dataSource.createQueryRunner();

    try {
      await queryRunner.connect();
      await queryRunner.startTransaction();

      const organization = await queryRunner.manager.create(Organization, {
        companyName: body.name,
        owner: {
          id: account.id,
        },
      });
      await queryRunner.manager.save(organization);

      const workspace = await queryRunner.manager.create(Workspaces, {
        name: organization.companyName + ' workspace',
        organization,
        apiKey: this.authHelper.generateApiKey(),
        timezoneUTCOffset: body.timezoneUTCOffset,
      });
      await queryRunner.manager.save(workspace);

      const team = await queryRunner.manager.create(OrganizationTeam, {
        teamName: 'Default team',
        organization,
        members: [
          {
            id: account.id,
          },
        ],
      });
      await queryRunner.manager.save(team);

      await queryRunner.commitTransaction();
    } catch (err) {
      await queryRunner.rollbackTransaction();
      this.error(err, this.update, session, account.id);
      throw new BadRequestException('Error during creation');
    }
  }

  // Will need update on for multiple workspaces and organization management
  public async getTeamMembers(
    account: Account,
    take = 10,
    skip = 0,
    isASC = false
  ) {
    if (!account.teams?.[0]) {
      throw new BadRequestException(
        'You have no team, finish company setup first'
      );
    }

    const sortOrder = isASC ? 'ASC' : 'DESC';

    const [members, total] = await this.accountRepository
      .createQueryBuilder('account')
      .innerJoin('account.teams', 'team', 'team.id = :teamId', {
        teamId: account.teams[0].id,
      })
      .orderBy('account.accountCreatedAt', sortOrder)
      .skip(skip)
      .take(take)
      .getManyAndCount();

    return {
      data: members.map((el) => ({
        id: el.id,
        name: el.firstName,
        email: el.email,
        createdAt: el.accountCreatedAt,
      })),
      total,
      page: skip / take + 1,
      pageCount: Math.ceil(total / take),
    };
  }
}

