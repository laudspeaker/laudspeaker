import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationPreference } from './entities/notification-preference.entity';
import { CreateNotificationPreferenceDto } from './dto/create-notification-preference.dto';
import { UpdateNotificationPreferenceDto } from './dto/update-notification-preference.dto';
import { BaseLaudspeakerService } from '@/common/services/base.laudspeaker.service';
import { Account } from '../accounts/entities/accounts.entity';

@Injectable()
export class NotificationPreferenceService extends BaseLaudspeakerService {
  constructor(
    @InjectRepository(NotificationPreference)
    private readonly notificationPreferenceRepository: Repository<NotificationPreference>,
  ) {
    super()
  }

  async create(
    account: Account,
    session: string,
    createNotificationPreferenceDto: CreateNotificationPreferenceDto
  ): Promise<NotificationPreference> {
    // Extract workspace from the account object
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];
    if (!workspace) {
      throw new Error('Workspace not found');
    }

    const preference = this.notificationPreferenceRepository.create({
      ...createNotificationPreferenceDto,
      workspace,
      journey_tags: createNotificationPreferenceDto.journey_tags || [],
      channels: createNotificationPreferenceDto.channels || [],
      template_tags: createNotificationPreferenceDto.template_tags || [],
    });

    return this.notificationPreferenceRepository.save(preference);
  }

  async findAll(account: Account, session: string): Promise<NotificationPreference[]> {
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];
    const results = await this.notificationPreferenceRepository.find();
    return results;
  }

  async findAllUnauthenticated(workspaceId: string, session: string): Promise<NotificationPreference[]> {
    const results = await this.notificationPreferenceRepository.find({
      where: {
        workspace: { id: workspaceId }
      }
    });
    return results;
  }

  async findOne(account: Account, session: string, id: string): Promise<NotificationPreference> {
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];
    const entity = await this.notificationPreferenceRepository.findOneBy({ id, workspace: { id: workspace.id } });
    if (!entity) {
      throw new NotFoundException(`Entity with ID "${id}" not found`);
    }
    return entity;
  }

  async findOneByName(workspaceId: string, name: string): Promise<NotificationPreference> {
    return await this.notificationPreferenceRepository.findOneBy({
      name: name,
      workspace: { id: workspaceId }
    });
  }

  async update(
    account: Account, session: string, id: string, UpdateNotificationPreferenceDto: UpdateNotificationPreferenceDto,
  ): Promise<NotificationPreference> {
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];
    const entity = await this.findOne(account, session, id);
    Object.assign(entity, UpdateNotificationPreferenceDto);
    return this.notificationPreferenceRepository.save(entity);
  }

  async remove(account: Account, session: string, id: string): Promise<void> {
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];
    const entity = await this.findOne(account, session, id);
    await this.notificationPreferenceRepository.remove(entity);
  }
}
