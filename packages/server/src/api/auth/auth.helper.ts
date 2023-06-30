import {
  Injectable,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryRunner, Repository } from 'typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { BaseJwtHelper } from '../../common/helper/base-jwt.helper';
import { DEFAULT_TEMPLATES } from '../../fixtures/user.default.templates';
import { Template } from '../templates/entities/template.entity';
import { Workflow } from '../workflows/entities/workflow.entity';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common/services';
import { Inject } from '@nestjs/common/decorators';
import { Audience } from '../audiences/entities/audience.entity';
import { JourneysService } from '../journeys/journeys.service';
import { StepsService } from '../steps/steps.service';
import { StepType } from '../steps/types/step.interface';

@Injectable()
export class AuthHelper extends BaseJwtHelper {
  @Inject(JourneysService) private readonly journeysService: JourneysService;
  @Inject(StepsService) private readonly stepsService: StepsService;
  @InjectRepository(Account)
  private readonly repository: Repository<Account>;
  @Inject(WINSTON_MODULE_NEST_PROVIDER)
  private readonly logger: LoggerService;

  private readonly jwt: JwtService;

  constructor(jwt: JwtService) {
    super();
    this.jwt = jwt;
  }

  // Decoding the JWT Token
  public async decode(token: string): Promise<unknown> {
    return this.jwt.decode(token, null);
  }

  // Get User by User ID we get from decode()
  public async validateUser(decoded: { id: string }): Promise<Account> {
    return this.repository.findOne({ where: { id: decoded.id } });
  }

  // Generate JWT Token
  public generateToken(user: Account): string {
    return this.jwt.sign({ id: user.id, email: user.email });
  }

  // Validate JWT Token, throw forbidden error if JWT Token is invalid
  private async validate(token: string): Promise<boolean | never> {
    const decoded: { id: string } = this.jwt.verify(token);

    if (!decoded) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    const user: Account = await this.validateUser(decoded);
    if (!user) {
      throw new UnauthorizedException();
    }

    return true;
  }

  private async generateExampleOnboardingJourney(
    account: Account,
    queryRunner: QueryRunner,
    session: string
  ) {
    const journey = await this.journeysService.transactionalCreate(
      account,
      'Basic Onboarding (Sample)',
      queryRunner,
      session
    );
    const waitUntil = await this.stepsService.transactionalInsert(
      account,
      { journeyID: journey.id, type: StepType.WAIT_UNTIL_BRANCH },
      queryRunner,
      session
    );
    const newsletter = await this.stepsService.transactionalInsert(
      account,
      { journeyID: journey.id, type: StepType.MESSAGE },
      queryRunner,
      session
    );
    const followUp = await this.stepsService.transactionalInsert(
      account,
      { journeyID: journey.id, type: StepType.MESSAGE },
      queryRunner,
      session
    );
    const newsletterExit = await this.stepsService.transactionalInsert(
      account,
      { journeyID: journey.id, type: StepType.EXIT },
      queryRunner,
      session
    );
    const followUpExit = await this.stepsService.transactionalInsert(
      account,
      { journeyID: journey.id, type: StepType.EXIT },
      queryRunner,
      session
    );

    const startstep =
      await this.stepsService.transactionalfindAllByTypeInJourney(
        account,
        StepType.START,
        journey.id,
        queryRunner,
        session
      );
    const visualLayout = {
      edges: [
        {
          id: 'b27200da1-bdd3-4c46-8216-7a09184f7bc0',
          data: {
            type: 'branch',
            branch: {
              id: '27200da1-bdd3-4c46-8216-7a09184f7bc0',
              type: 'event',
              conditions: [
                {
                  name: 'verify',
                  statements: [],
                  providerType: 'custom',
                  relationToNext: 'and',
                },
              ],
            },
          },
          type: 'branch',
          source: 'ee979f0a-653f-4e58-a425-726cb8c3cf6a',
          target: 'db24008a-c31e-4d9c-a3c0-ef255b5cdda5',
        },
        {
          id: 'b986ba05b-2a75-4bd2-a597-f11ef29e7b00',
          data: {
            type: 'branch',
            branch: {
              id: '986ba05b-2a75-4bd2-a597-f11ef29e7b00',
              type: 'maxTime',
              delay: {
                days: 2,
                hours: 0,
                minutes: 0,
              },
              timeType: 'timeDelay',
            },
          },
          type: 'branch',
          source: 'ee979f0a-653f-4e58-a425-726cb8c3cf6a',
          target: '55cb7651-09ab-4280-8b46-9d0dc22baaef',
        },
        {
          id: 'db24008a-c31e-4d9c-a3c0-ef255b5cdda5-a17820a5-3182-4cc5-8c4f-eda77d197ef8',
          type: 'primary',
          source: 'db24008a-c31e-4d9c-a3c0-ef255b5cdda5',
          target: 'a17820a5-3182-4cc5-8c4f-eda77d197ef8',
        },
        {
          id: 'ecc2333db-88d3-41d8-a22d-206ea092d8ab-ee979f0a-653f-4e58-a425-726cb8c3cf6a',
          type: 'primary',
          source: 'cc2333db-88d3-41d8-a22d-206ea092d8ab',
          target: 'ee979f0a-653f-4e58-a425-726cb8c3cf6a',
        },
        {
          id: '55cb7651-09ab-4280-8b46-9d0dc22baaef-3f6f7fc1-f0ca-41be-abba-1458fbd5ead4',
          type: 'primary',
          source: '55cb7651-09ab-4280-8b46-9d0dc22baaef',
          target: '3f6f7fc1-f0ca-41be-abba-1458fbd5ead4',
        },
      ],
      nodes: [
        {
          id: 'cc2333db-88d3-41d8-a22d-206ea092d8ab',
          data: {
            stepId: startstep[0].id,
          },
          type: 'start',
          position: {
            x: 0,
            y: 0,
          },
          selected: false,
        },
        {
          id: 'ee979f0a-653f-4e58-a425-726cb8c3cf6a',
          data: {
            type: 'waitUntil',
            stepId: waitUntil.id,
            branches: [
              {
                id: '27200da1-bdd3-4c46-8216-7a09184f7bc0',
                type: 'event',
                conditions: [
                  {
                    name: 'verify',
                    statements: [],
                    providerType: 'custom',
                    relationToNext: 'and',
                  },
                ],
              },
              {
                id: '986ba05b-2a75-4bd2-a597-f11ef29e7b00',
                type: 'maxTime',
                delay: {
                  days: 2,
                  hours: 0,
                  minutes: 0,
                },
                timeType: 'timeDelay',
              },
            ],
          },
          type: 'waitUntil',
          position: {
            x: 0,
            y: 125,
          },
          selected: false,
        },
        {
          id: 'db24008a-c31e-4d9c-a3c0-ef255b5cdda5',
          data: {
            type: 'message',
            stepId: newsletter.id,
            template: {
              type: 'email',
            },
          },
          type: 'message',
          position: {
            x: -260,
            y: 395,
          },
          selected: false,
        },
        {
          id: 'a17820a5-3182-4cc5-8c4f-eda77d197ef8',
          data: {
            stepId: followUpExit.id,
          },
          type: 'exit',
          position: {
            x: -260,
            y: 520,
          },
          selected: false,
        },
        {
          id: '55cb7651-09ab-4280-8b46-9d0dc22baaef',
          data: {
            type: 'message',
            stepId: followUp.id,
            template: {
              type: 'email',
            },
          },
          type: 'message',
          position: {
            x: 260,
            y: 395,
          },
          selected: false,
        },
        {
          id: '3f6f7fc1-f0ca-41be-abba-1458fbd5ead4',
          data: {
            stepId: newsletterExit.id,
          },
          type: 'exit',
          position: {
            x: 260,
            y: 520,
          },
          selected: false,
        },
      ],
    };

    await this.journeysService.updateLayoutTransactional(
      account,
      { id: journey.id, nodes: visualLayout.nodes, edges: visualLayout.edges },
      queryRunner,
      session
    );
  }

  private async generateExampleSingleCampaignJourney(
    account: Account,
    queryRunner: QueryRunner,
    session: string
  ) {
    const journey = await this.journeysService.transactionalCreate(
      account,
      'General Email Campaign (Sample)',
      queryRunner,
      session
    );
    const newsletter = await this.stepsService.transactionalInsert(
      account,
      { journeyID: journey.id, type: StepType.MESSAGE },
      queryRunner,
      session
    );
    const newsletterExit = await this.stepsService.transactionalInsert(
      account,
      { journeyID: journey.id, type: StepType.EXIT },
      queryRunner,
      session
    );
    const startstep =
      await this.stepsService.transactionalfindAllByTypeInJourney(
        account,
        StepType.START,
        journey.id,
        queryRunner,
        session
      );
    const visualLayout = {
      edges: [
        {
          id: 'e64bb8b23-ed24-453a-a5f7-3d03f88f813b-d9526784-78dd-41a8-b679-aa55dacaedfe',
          type: 'primary',
          source: '64bb8b23-ed24-453a-a5f7-3d03f88f813b',
          target: 'd9526784-78dd-41a8-b679-aa55dacaedfe',
        },
        {
          id: 'd9526784-78dd-41a8-b679-aa55dacaedfe-9d76b90f-a791-444c-8295-e6839432e586',
          type: 'primary',
          source: 'd9526784-78dd-41a8-b679-aa55dacaedfe',
          target: '9d76b90f-a791-444c-8295-e6839432e586',
        },
      ],
      nodes: [
        {
          id: '64bb8b23-ed24-453a-a5f7-3d03f88f813b',
          data: {
            stepId: startstep[0].id,
          },
          type: 'start',
          position: {
            x: 0,
            y: 0,
          },
          selected: false,
        },
        {
          id: 'd9526784-78dd-41a8-b679-aa55dacaedfe',
          data: {
            type: 'message',
            stepId: newsletter.id,
            template: {
              type: 'email',
            },
          },
          type: 'message',
          position: {
            x: 0,
            y: 125,
          },
          selected: false,
        },
        {
          id: '9d76b90f-a791-444c-8295-e6839432e586',
          data: {
            stepId: newsletterExit.id,
          },
          type: 'exit',
          position: {
            x: 0,
            y: 250,
          },
          selected: false,
        },
      ],
    };
    await this.journeysService.updateLayoutTransactional(
      account,
      { id: journey.id, nodes: visualLayout.nodes, edges: visualLayout.edges },
      queryRunner,
      session
    );
  }

  private async generateExampleModalJourney(
    account: Account,
    queryRunner: QueryRunner,
    session: string
  ) {
    const journey = await this.journeysService.transactionalCreate(
      account,
      'Display Modal (Sample)',
      queryRunner,
      session
    );
    const newsletter = await this.stepsService.transactionalInsert(
      account,
      { journeyID: journey.id, type: StepType.MESSAGE },
      queryRunner,
      session
    );
    const newsletterExit = await this.stepsService.transactionalInsert(
      account,
      { journeyID: journey.id, type: StepType.EXIT },
      queryRunner,
      session
    );
    const startstep =
      await this.stepsService.transactionalfindAllByTypeInJourney(
        account,
        StepType.START,
        journey.id,
        queryRunner,
        session
      );
    const visualLayout = {
      edges: [
        {
          id: 'e64bb8b23-ed24-453a-a5f7-3d03f88f813b-d9526784-78dd-41a8-b679-aa55dacaedfe',
          type: 'primary',
          source: '64bb8b23-ed24-453a-a5f7-3d03f88f813b',
          target: 'd9526784-78dd-41a8-b679-aa55dacaedfe',
        },
        {
          id: 'd9526784-78dd-41a8-b679-aa55dacaedfe-9d76b90f-a791-444c-8295-e6839432e586',
          type: 'primary',
          source: 'd9526784-78dd-41a8-b679-aa55dacaedfe',
          target: '9d76b90f-a791-444c-8295-e6839432e586',
        },
      ],
      nodes: [
        {
          id: '64bb8b23-ed24-453a-a5f7-3d03f88f813b',
          data: {
            stepId: startstep[0].id,
          },
          type: 'start',
          position: {
            x: 0,
            y: 0,
          },
          selected: false,
        },
        {
          id: 'd9526784-78dd-41a8-b679-aa55dacaedfe',
          data: {
            type: 'message',
            stepId: newsletter.id,
            template: {
              type: 'modal',
            },
          },
          type: 'message',
          position: {
            x: 0,
            y: 125,
          },
          selected: false,
        },
        {
          id: '9d76b90f-a791-444c-8295-e6839432e586',
          data: {
            stepId: newsletterExit.id,
          },
          type: 'exit',
          position: {
            x: 0,
            y: 250,
          },
          selected: false,
        },
      ],
    };
    await this.journeysService.updateLayoutTransactional(
      account,
      { id: journey.id, nodes: visualLayout.nodes, edges: visualLayout.edges },
      queryRunner,
      session
    );
  }

  // generate default templates and workflows for newly registered user
  public async generateDefaultData(
    account: Account,
    queryRunner: QueryRunner,
    session: string
  ) {
    await queryRunner.manager.save(
      DEFAULT_TEMPLATES.map((el) => {
        const template = new Template();
        template.id = el.id;
        template.name = el.name;
        template.owner = account;
        template.slackMessage = el.slackMessage;
        template.smsText = el.smsText;
        template.style = el.style;
        template.subject = el.subject;
        template.text = el.text;
        template.type = el.type;

        return template;
      })
    );

    await this.generateExampleOnboardingJourney(account, queryRunner, session);
    await this.generateExampleModalJourney(account, queryRunner, session);
    await this.generateExampleSingleCampaignJourney(
      account,
      queryRunner,
      session
    );
  }
}
