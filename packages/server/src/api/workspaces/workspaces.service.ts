import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Workspaces } from './entities/workspaces.entity';
import { Repository } from 'typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { AccountsService } from '../accounts/accounts.service';
import { CreateWorkspaceDto } from './dto/create-workspace.dto';
import { OrganizationService } from '../organizations/organizations.service';

@Injectable()
export class WorkspacesService {
  constructor(
    private accountsService: AccountsService,
    private organizationService: OrganizationService,
    @InjectRepository(Workspaces)
    private workspacesRepository: Repository<Workspaces>
  ) {}

  public async getAllWorkspaces(account: Account) {
    account = await this.accountsService.accountsRepository.findOne({
      where: { id: account.id },
      relations: ['teams.organization.workspaces'],
    });

    return account.teams[0].organization.workspaces;
  }

  public getCurrentWorkspace(account: Account) {
    return (
      account.currentWorkspace ||
      account.teams?.[0]?.organization?.workspaces?.[0]
    );
  }

  public async setCurrentWorkspace(account: Account, id: string) {
    const workspaces = await this.getAllWorkspaces(account);

    const newCurrentWorkspace = workspaces.find(
      (workspace) => workspace.id === id
    );

    if (!newCurrentWorkspace)
      throw new NotFoundException('Workspace not found');

    await this.accountsService.accountsRepository.save({
      id: account.id,
      currentWorkspace: { id: newCurrentWorkspace.id },
    });
  }

  public async createWorkspace(
    account: Account,
    createWorkspaceDto: CreateWorkspaceDto
  ) {
    await this.workspacesRepository.save({
      name: createWorkspaceDto.name,
      organization: { id: account.teams[0].organization.id },
      apiKey: this.organizationService.authHelper.generateApiKey(),
    });
  }
}

