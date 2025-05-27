import {
  Injectable,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryRunner, Repository } from 'typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { BaseJwtHelper } from '../../common/helper/base-jwt.helper';
import { DEFAULT_TEMPLATES } from '../../fixtures/user.default.templates';
import { Template, TemplateType } from '../templates/entities/template.entity';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common/services';
import { Inject } from '@nestjs/common/decorators';
import { JourneysService } from '../journeys/journeys.service';
import { StepsService } from '../steps/steps.service';
import { StepType } from '../steps/types/step.interface';
import generateName from '@good-ghosting/random-name-generator';
import { Organization } from '../organizations/entities/organization.entity';
import { OrganizationTeam } from '../organizations/entities/organization-team.entity';
import { randomUUID } from 'crypto';

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

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: AuthHelper.name,
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
        class: AuthHelper.name,
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
        class: AuthHelper.name,
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
        class: AuthHelper.name,
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
        class: AuthHelper.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  // Decoding the JWT Token
  public async decode(token: string): Promise<unknown> {
    this.log(
      `Decoding JWT Token: ${JSON.stringify(token)}`,
      this.decode.name,
      randomUUID()
    );
    return this.jwt.decode(token, null);
  }

  // Get User by User ID we get from decode()
  public async validateUser(decoded: { id: string }): Promise<Account> {
    /*
    this.log(
      `Finding user: ${JSON.stringify(decoded)}`,
      this.validateUser.name,
      randomUUID()
    );
    */
    const user = await this.repository.findOne({
      where: { id: decoded.id },
      relations: [
        'teams.organization.workspaces',
        'teams.organization.plan',
        'teams.organization.workspaces.mailgunConnections.sendingOptions',
        'teams.organization.workspaces.sendgridConnections.sendingOptions',
        'teams.organization.workspaces.resendConnections.sendingOptions',
        'teams.organization.workspaces.mailgunConnections.replyToOptions',
        'teams.organization.workspaces.sendgridConnections.replyToOptions',
        'teams.organization.workspaces.resendConnections.replyToOptions',
        'teams.organization.workspaces.twilioConnections',
        'teams.organization.workspaces.pushConnections',
        'teams.organization.owner',
      ],
    });
    /*
    this.log(
      `Found user: ${JSON.stringify(user)}`,
      this.validateUser.name,
      randomUUID()
    );
    */

    return user;
  }

  // Generate JWT Token
  public generateToken(user: Account): string {
    this.log(
      `Generating JWT Token: ${JSON.stringify(user)}`,
      this.generateToken.name,
      randomUUID()
    );
    return this.jwt.sign({ id: user.id, email: user.email });
  }

  // Validate JWT Token, throw forbidden error if JWT Token is invalid
  private async validate(token: string): Promise<boolean | never> {
    this.log(
      `Verifying JWT Token: ${JSON.stringify(token)}`,
      this.validate.name,
      randomUUID()
    );
    const decoded: { id: string } = this.jwt.verify(token);

    if (!decoded) {
      this.error(`Can't verify JWT`, this.validate.name, randomUUID());
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    this.log(
      `Validating decoded JWT Token: ${JSON.stringify(decoded)}`,
      this.validate.name,
      randomUUID()
    );
    const user: Account = await this.validateUser(decoded);
    if (!user) {
      this.error(`User not found`, this.validate.name, randomUUID());
      throw new UnauthorizedException();
    }

    return true;
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
    await this.journeysService.updateLayout(
      account,
      { id: journey.id, nodes: visualLayout.nodes, edges: visualLayout.edges },
      session,
      queryRunner,
    );
  }

  // generate default templates and workflows for newly registered user
  public async generateDefaultData(
    account: Account,
    queryRunner: QueryRunner,
    session: string
  ) {
    account = await queryRunner.manager.findOne(Account, {
      where: { id: account.id },
      relations: ['teams.organization.workspaces'],
    });

    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    const templates = await queryRunner.manager.save(
      DEFAULT_TEMPLATES.map((el) => {
        const template = new Template();
        template.id = el.id;
        template.name = el.name;
        template.workspace = workspace;
        template.slackMessage = el.slackMessage;
        template.smsText = el.smsText;
        template.style = el.style;
        template.subject = el.subject;
        template.text = el.text;
        template.type = el.type;
        if (template.type === TemplateType.CUSTOM_COMPONENT) {
          template.customEvents = el.customEvents;
          template.customFields = el.customFields;
        }

        return template;
      })
    );

    const sidechecklistTemplate = templates.find(
      (el) => el.name === DEFAULT_TEMPLATES[6].name
    );

    const reactivationTemplate = templates.find(
      (el) => el.name === DEFAULT_TEMPLATES[0].name
    );
    const newsTemplate = templates.find(
      (el) => el.name === DEFAULT_TEMPLATES[3].name
    );
    const invoiceTemplate = templates.find(
      (el) => el.name === DEFAULT_TEMPLATES[2].name
    );

    await this.generateExampleSingleCampaignJourney(
      account,
      queryRunner,
      session
    );
  }
}
