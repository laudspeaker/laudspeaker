import {
  Logger,
  Inject,
  Injectable,
  HttpException,
  NotFoundException,
  forwardRef,
  HttpStatus,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  DataSource,
  FindOptionsWhere,
  In,
  Like,
  QueryRunner,
  Repository,
} from 'typeorm';
import {
  parse,
  format,
  eachDayOfInterval,
  eachWeekOfInterval,
  startOfDay,
  endOfDay,
  addDays
} from 'date-fns';
import { Journey } from './entities/journey.entity';
import { JourneyVersion } from './entities/journey-version.entity';
import { StepsService } from '../steps/steps.service';
import { JourneyLocationsService } from './journey-locations.service';
import { JourneysService } from './journeys.service';
import { BaseLaudspeakerService } from '../../common/services/base.laudspeaker.service';
import { Account } from '../accounts/entities/accounts.entity';
import { VisualLayout } from './types/visual-layout.interface';
import { randomUUID } from 'node:crypto';

@Injectable()
export class JourneyVersionService extends BaseLaudspeakerService {
  constructor(
    @InjectRepository(JourneyVersion)
    public journeyVersionRepository: Repository<JourneyVersion>,
    @Inject(forwardRef(() => JourneysService))
    private readonly journeysService: JourneysService,
    @Inject(JourneyLocationsService)
    private readonly journeyLocationsService: JourneyLocationsService,
  ) {
    super();
  }

  async create(account: Account, journey_id: string, session: string) {
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

    try {
      const count = await this.getVersionCount(journey_id, workspace.id);

      const version = await this.journeyVersionRepository.save({
        workspace: { id: workspace.id },
        journey_id: journey_id,
        number: count + 1,
        layout: {
          nodes: [],
          edges: [],
        },
        state: "Draft",
        created_by: { id: account.id },
        updated_by: { id: account.id },
        uuid: randomUUID(),
      });

      return version;
    }
    catch(err) {
      throw err;
    }
  }

  async index(account: Account, journey_id: string, session: string) {
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

    const journey = await this.journeysService.findByID(account, journey_id, session);

    return this.journeyVersionRepository.find({
      where: {
        workspace_id: workspace.id,
        journey_id: journey_id,
      },
      order: {
        id: 'asc',
      }
    });
  }

  async updateLayout(
    account: Account,
    journeyVersion: JourneyVersion,
    layout: VisualLayout
  ) {
    journeyVersion.layout = layout;
    journeyVersion.updated_by = account;

    return this.journeyVersionRepository.save(journeyVersion);
  }

  async publish(account: Account, journey_id: string, version_uuid: string, session: string) {
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

    let version = await this.getVersion(account, journey_id, version_uuid);

    try {
      version = await this.journeyVersionRepository.save({
        ...version,
        state: "Published"
      });

      return version;
    } catch (err) {
      throw err;
    }
  }

  /**
   * checks out the published workflow
   * @param account
   * @param id
   * @param session
   * @returns
   */
  async checkOut(account: Account, journey_id: string, version_uuid: string, session: string) {
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];
    const journey = await this.journeysService.findByID(account, journey_id, session);
    // const journey = await this.journeysService.findOne(<Account>user, id, session);
    let version = null;

    if (!journey) throw new NotFoundException('Journey not found');

    if (version_uuid)
      version = await this.getVersion(account, journey_id, version_uuid);

    // mark any drafts as abandoned
    await this.abandonDraft(account, journey_id);
    let newVersion = await this.create(account, journey_id, session);

    if (version) {
      // Update Draft layout from the existing version;
      newVersion = await this.updateLayout(account, newVersion, version.layout);
    }

    const data = {
      uuid: newVersion.uuid,
      name: "Draft",
      created_at: new Date(),
      updated_at: new Date(),
      visual_layout: newVersion.layout
    };

    return data;
  }

  async getVersions(account: Account, journey_id: string) {
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

    return this.journeyVersionRepository.find({
      where: {
        workspace_id: workspace.id,
        journey_id: journey_id
      },
      order: {
        id: 'desc'
      }
    });
  }

  async getLatestVersion(account: Account, journey_id: string) {
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

    return this.journeyVersionRepository.findOne({
      where: {
        workspace_id: workspace.id,
        journey_id: journey_id
      },
      order: {
        id: 'desc'
      }
    });
  }

  async getVersion(account: Account, journey_id: string, version_uuid: string) {
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

    return this.journeyVersionRepository.findOne({
      where: {
        workspace_id: workspace.id,
        journey_id: journey_id,
        uuid: version_uuid,
      }
    });
  }

  async getDraftVersion(account: Account, journey_id: string) {
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

    return this.journeyVersionRepository.findOne({
      where: {
        workspace_id: workspace.id,
        journey_id: journey_id,
        state: "Draft"
      },
      order: {
        id: 'desc'
      }
    });
  }

  async getVersionCount(journey_id: string, workspace_id: string) {
    return this.journeyVersionRepository.countBy({
      workspace_id,
      journey_id,
    });
  }

  async abandonDraft(account: Account, journey_id: string) {
    let version = await this.getDraftVersion(account, journey_id);

    if (version) {
      return this.journeyVersionRepository.save({
        ...version,
        State: "Abandoned"
      });
    }
  }
}
