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

  async create(account: Account, journey: Journey, session: string) {
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

    try {
      const count = await this.getVersionCount(journey.id, workspace.id);

      const version = await this.journeyVersionRepository.save({
        workspace: { id: workspace.id },
        journey_id: journey.id,
        number: count + 1,
        layout: {
          nodes: [],
          edges: [],
        },
        state: "Draft",
        created_by: { id: account.id },
        updated_by: { id: account.id },
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

  async publish(account: Account, journey_id: string, session: string) {
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

    const journey = await this.journeysService.findByID(account, journey_id, session);

    try {
      await this.create(account, journey, session);


      // return result;
    } catch (err) {
      // this.error(err, this.markDeleted.name, session, account.email);
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
  async checkOut(account: Account, journey_id: string, session: string) {
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

    const journey = await this.journeysService.findByID(account, journey_id, session);

    try {
      await this.create(account, journey, session);

      
      // const result = await this.journeyVersionRepository.update(
      //   {
      //     workspace_id: workspace.id
      //     // id: id,
      //   },
      // );

      // return result;
    } catch (err) {
      // this.error(err, this.markDeleted.name, session, account.email);
      throw err;
    }
  }

  async getLatestVersion(account: Account, journey_id: string) {
    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

    return this.journeyVersionRepository.findOne({
      where: {
        workspace_id: workspace.id,
        journey_id: journey_id
      },
      order: {
        number: 'desc'
      }
    })
  }
  async getVersionCount(journey_id: string, workspace_id: string) {
    return this.journeyVersionRepository.countBy({
      workspace_id,
      journey_id,
    });
  }

}

