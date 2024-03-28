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
  @InjectRepository(OrganizationTeam)
  private readonly organizationTeamRepository: Repository<OrganizationTeam>;
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
        'teams.organization.workspaces.mailgunConnections.sendingOptions',
        'teams.organization.workspaces.sendgridConnections.sendingOptions',
        'teams.organization.workspaces.resendConnections.sendingOptions',
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

  private async generateExampleSideChecklist(
    account: Account,
    template: Template,
    queryRunner: QueryRunner,
    session: string
  ) {
    const journey = await this.journeysService.transactionalCreate(
      account,
      'Example onboarding checklist',
      queryRunner,
      session
    );

    const trackerId = generateName({ number: true }).dashed;

    const startstep =
      await this.stepsService.transactionalfindAllByTypeInJourney(
        account,
        StepType.START,
        journey.id,
        queryRunner,
        session
      );
    const trackerOne = await this.stepsService.transactionalInsert(
      account,
      { journeyID: journey.id, type: StepType.TRACKER },
      queryRunner,
      session
    );
    const waitUntilOne = await this.stepsService.transactionalInsert(
      account,
      { journeyID: journey.id, type: StepType.WAIT_UNTIL_BRANCH },
      queryRunner,
      session
    );
    const trackerTwo = await this.stepsService.transactionalInsert(
      account,
      { journeyID: journey.id, type: StepType.TRACKER },
      queryRunner,
      session
    );
    const waitUntilTwo = await this.stepsService.transactionalInsert(
      account,
      { journeyID: journey.id, type: StepType.WAIT_UNTIL_BRANCH },
      queryRunner,
      session
    );
    const trackerThree = await this.stepsService.transactionalInsert(
      account,
      { journeyID: journey.id, type: StepType.TRACKER },
      queryRunner,
      session
    );
    const waitUntilThree = await this.stepsService.transactionalInsert(
      account,
      { journeyID: journey.id, type: StepType.WAIT_UNTIL_BRANCH },
      queryRunner,
      session
    );
    const trackerFour = await this.stepsService.transactionalInsert(
      account,
      { journeyID: journey.id, type: StepType.TRACKER },
      queryRunner,
      session
    );
    const waitUntilFour = await this.stepsService.transactionalInsert(
      account,
      { journeyID: journey.id, type: StepType.WAIT_UNTIL_BRANCH },
      queryRunner,
      session
    );
    const trackerFive = await this.stepsService.transactionalInsert(
      account,
      { journeyID: journey.id, type: StepType.TRACKER },
      queryRunner,
      session
    );
    const exit = await this.stepsService.transactionalInsert(
      account,
      { journeyID: journey.id, type: StepType.EXIT },
      queryRunner,
      session
    );

    const visualLayout = {
      edges: [
        {
          id: 'e776ee148-00df-4fb8-9781-6e921050d491-3f451c93-0545-4ca0-aac8-069f84b4998e',
          type: 'primary',
          source: '776ee148-00df-4fb8-9781-6e921050d491',
          target: '3f451c93-0545-4ca0-aac8-069f84b4998e',
        },
        {
          id: '3f451c93-0545-4ca0-aac8-069f84b4998e-1cf6cf01-dcde-482e-b29e-b2c1a78c1892',
          type: 'primary',
          source: '3f451c93-0545-4ca0-aac8-069f84b4998e',
          target: '1cf6cf01-dcde-482e-b29e-b2c1a78c1892',
        },
        {
          id: 'be29d13d6-de72-4801-af09-c07652e90bf8',
          data: {
            type: 'branch',
            branch: {
              id: 'e29d13d6-de72-4801-af09-c07652e90bf8',
              type: 'event',
              conditions: [
                {
                  event: '1-to-2',
                  trackerId,
                  providerType: 'tracker',
                  relationToNext: 'or',
                },
              ],
            },
          },
          type: 'branch',
          source: '1cf6cf01-dcde-482e-b29e-b2c1a78c1892',
          target: '77ef64b7-783d-42c5-9902-7969358353c9',
        },
        {
          id: '77ef64b7-783d-42c5-9902-7969358353c9-4536f114-6392-4246-9f7c-4c1c7f7fddd4',
          type: 'primary',
          source: '77ef64b7-783d-42c5-9902-7969358353c9',
          target: '4536f114-6392-4246-9f7c-4c1c7f7fddd4',
        },
        {
          id: 'bb7da45ed-2911-4689-8161-8421726b9e2f',
          data: {
            type: 'branch',
            branch: {
              id: 'b7da45ed-2911-4689-8161-8421726b9e2f',
              type: 'event',
              conditions: [
                {
                  event: '2-to-3',
                  trackerId,
                  providerType: 'tracker',
                  relationToNext: 'or',
                },
              ],
            },
          },
          type: 'branch',
          source: '4536f114-6392-4246-9f7c-4c1c7f7fddd4',
          target: '1d86c6d3-564b-405f-86a5-f494e10491fa',
        },
        {
          id: '1d86c6d3-564b-405f-86a5-f494e10491fa-3c6eaf46-b764-4220-8e04-63de14a6744f',
          type: 'primary',
          source: '1d86c6d3-564b-405f-86a5-f494e10491fa',
          target: '3c6eaf46-b764-4220-8e04-63de14a6744f',
        },
        {
          id: 'bf9195627-90d3-4bb0-8907-0fda80a3971c',
          data: {
            type: 'branch',
            branch: {
              id: 'f9195627-90d3-4bb0-8907-0fda80a3971c',
              type: 'event',
              conditions: [
                {
                  event: '3-to-start',
                  trackerId,
                  providerType: 'tracker',
                  relationToNext: 'or',
                },
              ],
            },
          },
          type: 'branch',
          source: '3c6eaf46-b764-4220-8e04-63de14a6744f',
          target: 'c59f3dd9-e6ea-4485-a938-b6518915bfba',
        },
        {
          id: 'c59f3dd9-e6ea-4485-a938-b6518915bfba-5125f2ed-9218-4905-ae7d-5c42d1352c82',
          type: 'primary',
          source: 'c59f3dd9-e6ea-4485-a938-b6518915bfba',
          target: '5125f2ed-9218-4905-ae7d-5c42d1352c82',
        },
        {
          id: 'b67eb779c-7324-4f79-8451-35defea5869c',
          data: {
            type: 'branch',
            branch: {
              id: '67eb779c-7324-4f79-8451-35defea5869c',
              type: 'event',
              conditions: [
                {
                  event: 'start',
                  trackerId,
                  providerType: 'tracker',
                  relationToNext: 'or',
                },
              ],
            },
          },
          type: 'branch',
          source: '5125f2ed-9218-4905-ae7d-5c42d1352c82',
          target: '0ae71936-923a-429b-a9c1-38792cb900a1',
        },
        {
          id: '0ae71936-923a-429b-a9c1-38792cb900a1-4b22a55d-5efe-4f11-ba0a-2afe54e026b1',
          type: 'primary',
          source: '0ae71936-923a-429b-a9c1-38792cb900a1',
          target: '4b22a55d-5efe-4f11-ba0a-2afe54e026b1',
        },
      ],
      nodes: [
        {
          id: '776ee148-00df-4fb8-9781-6e921050d491',
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
          id: '3f451c93-0545-4ca0-aac8-069f84b4998e',
          data: {
            type: 'tracker',
            stepId: trackerOne.id,
            tracker: {
              fields: [
                {
                  name: 'MainTitle',
                  type: 'String',
                  value: 'Welcome to Example',
                },
                {
                  name: 'step-1-title',
                  type: 'String',
                  value: 'Create a example',
                },
                {
                  name: 'step-1-desc',
                  type: 'String',
                  value:
                    'An introduction to "projects" and instructions on how to create them.',
                },
                {
                  name: 'step-1-button-text',
                  type: 'String',
                  value: 'Create a example',
                },
                {
                  name: 'step-1-done',
                  type: 'Boolean',
                  value: 'false',
                },
                {
                  name: 'step-2-title',
                  type: 'String',
                  value: 'Import contacts',
                },
                {
                  name: 'step-2-desc',
                  type: 'String',
                  value:
                    'An introduction to "contacts" An introduction to "contacts" An introduction to "contacts" An introduction to "contacts"An introduction to "contacts',
                },
                {
                  name: 'step-2-button-text',
                  type: 'String',
                  value: 'Import contacts',
                },
                {
                  name: 'step-2-done',
                  type: 'Boolean',
                  value: 'false',
                },
                {
                  name: 'step-3-title',
                  type: 'String',
                  value: 'Create a sequence',
                },
                {
                  name: 'step-3-desc',
                  type: 'String',
                  value:
                    'An introduction to "sequence", the value. An introduction to "sequence", the value. An introduction to "sequence", the value.',
                },
                {
                  name: 'step-3-button-text',
                  type: 'String',
                  value: 'Create a sequence',
                },
                {
                  name: 'step-3-done',
                  type: 'Boolean',
                  value: 'false',
                },
              ],
              trackerId,
              visibility: 'show',
              trackerTemplate: {
                id: template.id,
                name: template.name,
              },
            },
            needsCheck: false,
            showErrors: true,
          },
          type: 'tracker',
          position: {
            x: 0,
            y: 114,
          },
          selected: false,
        },
        {
          id: '1cf6cf01-dcde-482e-b29e-b2c1a78c1892',
          data: {
            type: 'waitUntil',
            stepId: waitUntilOne.id,
            branches: [
              {
                id: 'e29d13d6-de72-4801-af09-c07652e90bf8',
                type: 'event',
                conditions: [
                  {
                    event: '1-to-2',
                    trackerId,
                    providerType: 'tracker',
                    relationToNext: 'or',
                  },
                ],
              },
            ],
          },
          type: 'waitUntil',
          position: {
            x: 0,
            y: 238,
          },
          selected: false,
        },
        {
          id: '77ef64b7-783d-42c5-9902-7969358353c9',
          data: {
            type: 'tracker',
            stepId: trackerTwo.id,
            tracker: {
              fields: [
                {
                  name: 'MainTitle',
                  type: 'String',
                  value: 'Welcome to Example',
                },
                {
                  name: 'step-1-title',
                  type: 'String',
                  value: 'Create a example',
                },
                {
                  name: 'step-1-desc',
                  type: 'String',
                  value:
                    'An introduction to "projects" and instructions on how to create them.',
                },
                {
                  name: 'step-1-button-text',
                  type: 'String',
                  value: 'Create a example',
                },
                {
                  name: 'step-1-done',
                  type: 'Boolean',
                  value: 'true',
                },
                {
                  name: 'step-2-title',
                  type: 'String',
                  value: 'Import contacts',
                },
                {
                  name: 'step-2-desc',
                  type: 'String',
                  value:
                    'An introduction to "contacts" An introduction to "contacts" An introduction to "contacts" An introduction to "contacts"An introduction to "contacts',
                },
                {
                  name: 'step-2-button-text',
                  type: 'String',
                  value: 'Import contacts',
                },
                {
                  name: 'step-2-done',
                  type: 'Boolean',
                  value: 'false',
                },
                {
                  name: 'step-3-title',
                  type: 'String',
                  value: 'Create a sequence',
                },
                {
                  name: 'step-3-desc',
                  type: 'String',
                  value:
                    'An introduction to "sequence", the value. An introduction to "sequence", the value. An introduction to "sequence", the value.',
                },
                {
                  name: 'step-3-button-text',
                  type: 'String',
                  value: 'Create a sequence',
                },
                {
                  name: 'step-3-done',
                  type: 'Boolean',
                  value: 'false',
                },
              ],
              trackerId,
              visibility: 'show',
              trackerTemplate: {
                id: template.id,
                name: template.name,
              },
            },
            needsCheck: false,
          },
          type: 'tracker',
          position: {
            x: 0,
            y: 362,
          },
          selected: false,
        },
        {
          id: '4536f114-6392-4246-9f7c-4c1c7f7fddd4',
          data: {
            type: 'waitUntil',
            stepId: waitUntilTwo.id,
            branches: [
              {
                id: 'b7da45ed-2911-4689-8161-8421726b9e2f',
                type: 'event',
                conditions: [
                  {
                    event: '2-to-3',
                    trackerId,
                    providerType: 'tracker',
                    relationToNext: 'or',
                  },
                ],
              },
            ],
          },
          type: 'waitUntil',
          position: {
            x: 0,
            y: 486,
          },
          selected: false,
        },
        {
          id: '1d86c6d3-564b-405f-86a5-f494e10491fa',
          data: {
            type: 'tracker',
            stepId: trackerThree.id,
            tracker: {
              fields: [
                {
                  name: 'MainTitle',
                  type: 'String',
                  value: 'Welcome to Example',
                },
                {
                  name: 'step-1-title',
                  type: 'String',
                  value: 'Create a example',
                },
                {
                  name: 'step-1-desc',
                  type: 'String',
                  value:
                    'An introduction to "projects" and instructions on how to create them.',
                },
                {
                  name: 'step-1-button-text',
                  type: 'String',
                  value: 'Create a example',
                },
                {
                  name: 'step-1-done',
                  type: 'Boolean',
                  value: 'true',
                },
                {
                  name: 'step-2-title',
                  type: 'String',
                  value: 'Import contacts',
                },
                {
                  name: 'step-2-desc',
                  type: 'String',
                  value:
                    'An introduction to "contacts" An introduction to "contacts" An introduction to "contacts" An introduction to "contacts"An introduction to "contacts',
                },
                {
                  name: 'step-2-button-text',
                  type: 'String',
                  value: 'Import contacts',
                },
                {
                  name: 'step-2-done',
                  type: 'Boolean',
                  value: 'true',
                },
                {
                  name: 'step-3-title',
                  type: 'String',
                  value: 'Create a sequence',
                },
                {
                  name: 'step-3-desc',
                  type: 'String',
                  value:
                    'An introduction to "sequence", the value. An introduction to "sequence", the value. An introduction to "sequence", the value.',
                },
                {
                  name: 'step-3-button-text',
                  type: 'String',
                  value: 'Create a sequence',
                },
                {
                  name: 'step-3-done',
                  type: 'Boolean',
                  value: 'false',
                },
              ],
              trackerId,
              visibility: 'show',
              trackerTemplate: {
                id: template.id,
                name: template.name,
              },
            },
            needsCheck: false,
          },
          type: 'tracker',
          position: {
            x: 0,
            y: 610,
          },
          selected: false,
        },
        {
          id: '3c6eaf46-b764-4220-8e04-63de14a6744f',
          data: {
            type: 'waitUntil',
            stepId: waitUntilThree.id,
            branches: [
              {
                id: 'f9195627-90d3-4bb0-8907-0fda80a3971c',
                type: 'event',
                conditions: [
                  {
                    event: '3-to-start',
                    trackerId,
                    providerType: 'tracker',
                    relationToNext: 'or',
                  },
                ],
              },
            ],
          },
          type: 'waitUntil',
          position: {
            x: 0,
            y: 734,
          },
          selected: false,
        },
        {
          id: 'c59f3dd9-e6ea-4485-a938-b6518915bfba',
          data: {
            type: 'tracker',
            stepId: trackerFour.id,
            tracker: {
              fields: [
                {
                  name: 'MainTitle',
                  type: 'String',
                  value: 'Welcome to Example',
                },
                {
                  name: 'step-1-title',
                  type: 'String',
                  value: 'Create a example',
                },
                {
                  name: 'step-1-desc',
                  type: 'String',
                  value:
                    'An introduction to "projects" and instructions on how to create them.',
                },
                {
                  name: 'step-1-button-text',
                  type: 'String',
                  value: 'Create a example',
                },
                {
                  name: 'step-1-done',
                  type: 'Boolean',
                  value: 'true',
                },
                {
                  name: 'step-2-title',
                  type: 'String',
                  value: 'Import contacts',
                },
                {
                  name: 'step-2-desc',
                  type: 'String',
                  value:
                    'An introduction to "contacts" An introduction to "contacts" An introduction to "contacts" An introduction to "contacts"An introduction to "contacts',
                },
                {
                  name: 'step-2-button-text',
                  type: 'String',
                  value: 'Import contacts',
                },
                {
                  name: 'step-2-done',
                  type: 'Boolean',
                  value: 'true',
                },
                {
                  name: 'step-3-title',
                  type: 'String',
                  value: 'Create a sequence',
                },
                {
                  name: 'step-3-desc',
                  type: 'String',
                  value:
                    'An introduction to "sequence", the value. An introduction to "sequence", the value. An introduction to "sequence", the value.',
                },
                {
                  name: 'step-3-button-text',
                  type: 'String',
                  value: 'Create a sequence',
                },
                {
                  name: 'step-3-done',
                  type: 'Boolean',
                  value: 'true',
                },
              ],
              trackerId,
              visibility: 'show',
              trackerTemplate: {
                id: template.id,
                name: template.name,
              },
            },
            needsCheck: false,
          },
          type: 'tracker',
          position: {
            x: 0,
            y: 858,
          },
          selected: false,
        },
        {
          id: '5125f2ed-9218-4905-ae7d-5c42d1352c82',
          data: {
            type: 'waitUntil',
            stepId: waitUntilFour.id,
            branches: [
              {
                id: '67eb779c-7324-4f79-8451-35defea5869c',
                type: 'event',
                conditions: [
                  {
                    event: 'start',
                    trackerId,
                    providerType: 'tracker',
                    relationToNext: 'or',
                  },
                ],
              },
            ],
          },
          type: 'waitUntil',
          position: {
            x: 0,
            y: 982,
          },
          selected: false,
        },
        {
          id: '0ae71936-923a-429b-a9c1-38792cb900a1',
          data: {
            type: 'tracker',
            stepId: trackerFive.id,
            tracker: {
              fields: [
                {
                  name: 'MainTitle',
                  type: 'String',
                  value: 'Welcome to Example',
                },
                {
                  name: 'step-1-title',
                  type: 'String',
                  value: 'Create a example',
                },
                {
                  name: 'step-1-desc',
                  type: 'String',
                  value:
                    'An introduction to "projects" and instructions on how to create them.',
                },
                {
                  name: 'step-1-button-text',
                  type: 'String',
                  value: 'Create a example',
                },
                {
                  name: 'step-1-done',
                  type: 'Boolean',
                  value: 'true',
                },
                {
                  name: 'step-2-title',
                  type: 'String',
                  value: 'Import contacts',
                },
                {
                  name: 'step-2-desc',
                  type: 'String',
                  value:
                    'An introduction to "contacts" An introduction to "contacts" An introduction to "contacts" An introduction to "contacts"An introduction to "contacts',
                },
                {
                  name: 'step-2-button-text',
                  type: 'String',
                  value: 'Import contacts',
                },
                {
                  name: 'step-2-done',
                  type: 'Boolean',
                  value: 'true',
                },
                {
                  name: 'step-3-title',
                  type: 'String',
                  value: 'Create a sequence',
                },
                {
                  name: 'step-3-desc',
                  type: 'String',
                  value:
                    'An introduction to "sequence", the value. An introduction to "sequence", the value. An introduction to "sequence", the value.',
                },
                {
                  name: 'step-3-button-text',
                  type: 'String',
                  value: 'Create a sequence',
                },
                {
                  name: 'step-3-done',
                  type: 'Boolean',
                  value: 'true',
                },
              ],
              trackerId,
              visibility: 'hide',
              trackerTemplate: {
                id: template.id,
                name: template.name,
              },
            },
            needsCheck: false,
          },
          type: 'tracker',
          position: {
            x: 0,
            y: 1106,
          },
          selected: false,
        },
        {
          id: '4b22a55d-5efe-4f11-ba0a-2afe54e026b1',
          data: {
            stepId: exit.id,
          },
          type: 'exit',
          position: {
            x: 0,
            y: 1220,
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

  private async generateExampleThreeBranchEventJourney(
    account: Account,
    templates: Template[],
    queryRunner: QueryRunner,
    session: string
  ) {
    const journey = await this.journeysService.transactionalCreate(
      account,
      'Three branch journey (Sample)',
      queryRunner,
      session
    );
    const waitUntil = await this.stepsService.transactionalInsert(
      account,
      { journeyID: journey.id, type: StepType.WAIT_UNTIL_BRANCH },
      queryRunner,
      session
    );
    const reactivation = await this.stepsService.transactionalInsert(
      account,
      { journeyID: journey.id, type: StepType.MESSAGE },
      queryRunner,
      session
    );
    const reactivationJumpTo = await this.stepsService.transactionalInsert(
      account,
      { journeyID: journey.id, type: StepType.LOOP },
      queryRunner,
      session
    );
    const newsletter = await this.stepsService.transactionalInsert(
      account,
      { journeyID: journey.id, type: StepType.MESSAGE },
      queryRunner,
      session
    );
    const newsletterJumpTo = await this.stepsService.transactionalInsert(
      account,
      { journeyID: journey.id, type: StepType.LOOP },
      queryRunner,
      session
    );
    const invoice = await this.stepsService.transactionalInsert(
      account,
      { journeyID: journey.id, type: StepType.MESSAGE },
      queryRunner,
      session
    );
    const invoiceJumpTo = await this.stepsService.transactionalInsert(
      account,
      { journeyID: journey.id, type: StepType.LOOP },
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
          id: 'ef51c7f51-b5c6-4111-b72a-bc91a223619d-97f37a62-0a53-4b97-8e3c-ef413fc4fa24',
          type: 'primary',
          source: 'f51c7f51-b5c6-4111-b72a-bc91a223619d',
          target: '97f37a62-0a53-4b97-8e3c-ef413fc4fa24',
        },
        {
          id: 'b969aa15c-cb15-447b-805e-9e3398b130ae',
          data: {
            type: 'branch',
            branch: {
              id: '969aa15c-cb15-447b-805e-9e3398b130ae',
              type: 'event',
              conditions: [
                {
                  name: 'reactivation',
                  statements: [],
                  providerType: 'custom',
                  relationToNext: 'or',
                },
              ],
            },
          },
          type: 'branch',
          source: '97f37a62-0a53-4b97-8e3c-ef413fc4fa24',
          target: '88e3aeb3-a8a1-4245-acfd-69cb17cae8ad',
        },
        {
          id: 'b6406f073-41bb-4de8-a32c-6606e5601dcc',
          type: 'branch',
          data: {
            type: 'branch',
            branch: {
              id: '6406f073-41bb-4de8-a32c-6606e5601dcc',
              type: 'event',
              conditions: [
                {
                  name: 'newsletter',
                  providerType: 'custom',
                  relationToNext: 'or',
                  statements: [],
                },
              ],
            },
          },
          source: '97f37a62-0a53-4b97-8e3c-ef413fc4fa24',
          target: '059ee8e9-f27a-45b6-8660-8ba102eefaa0',
        },
        {
          id: 'b2bc7f31b-23ba-423f-8419-c118d281e670',
          type: 'branch',
          data: {
            type: 'branch',
            branch: {
              id: '2bc7f31b-23ba-423f-8419-c118d281e670',
              type: 'event',
              conditions: [
                {
                  name: 'invoice',
                  providerType: 'custom',
                  relationToNext: 'or',
                  statements: [],
                },
              ],
            },
          },
          source: '97f37a62-0a53-4b97-8e3c-ef413fc4fa24',
          target: '7c27462f-7d05-4d1c-b586-f373ba348bb3',
        },
        {
          id: '88e3aeb3-a8a1-4245-acfd-69cb17cae8ad-a9661283-1f16-4f2e-b61c-0fdf028cb6bd',
          type: 'primary',
          source: '88e3aeb3-a8a1-4245-acfd-69cb17cae8ad',
          target: 'a9661283-1f16-4f2e-b61c-0fdf028cb6bd',
        },
        {
          id: '059ee8e9-f27a-45b6-8660-8ba102eefaa0-aca80750-a8c1-4ed5-945e-f428145a31bc',
          type: 'primary',
          source: '059ee8e9-f27a-45b6-8660-8ba102eefaa0',
          target: 'aca80750-a8c1-4ed5-945e-f428145a31bc',
        },
        {
          id: '7c27462f-7d05-4d1c-b586-f373ba348bb3-313bd3a7-b9d6-412a-9897-3d54eb4097ae',
          type: 'primary',
          source: '7c27462f-7d05-4d1c-b586-f373ba348bb3',
          target: '313bd3a7-b9d6-412a-9897-3d54eb4097ae',
        },
      ],
      nodes: [
        {
          id: 'f51c7f51-b5c6-4111-b72a-bc91a223619d',
          data: {
            stepId: startstep[0].id,
            disabled: false,
          },
          type: 'start',
          position: {
            x: 0,
            y: 0,
          },
          selected: false,
        },
        {
          id: '97f37a62-0a53-4b97-8e3c-ef413fc4fa24',
          data: {
            type: 'waitUntil',
            stepId: waitUntil.id,
            branches: [
              {
                id: '969aa15c-cb15-447b-805e-9e3398b130ae',
                type: 'event',
                conditions: [
                  {
                    name: 'reactivation',
                    statements: [],
                    providerType: 'custom',
                    relationToNext: 'or',
                  },
                ],
              },
              {
                id: '6406f073-41bb-4de8-a32c-6606e5601dcc',
                type: 'event',
                conditions: [
                  {
                    name: 'newsletter',
                    providerType: 'custom',
                    relationToNext: 'or',
                    statements: [],
                  },
                ],
              },
              {
                id: '2bc7f31b-23ba-423f-8419-c118d281e670',
                type: 'event',
                conditions: [
                  {
                    name: 'invoice',
                    providerType: 'custom',
                    relationToNext: 'or',
                    statements: [],
                  },
                ],
              },
            ],
            showErrors: true,
            disabled: false,
          },
          type: 'waitUntil',
          position: {
            x: 0,
            y: 114,
          },
          selected: false,
        },
        {
          id: '88e3aeb3-a8a1-4245-acfd-69cb17cae8ad',
          data: {
            type: 'message',
            template: {
              type: 'email',
              selected: {
                id: templates[0].id,
                name: templates[0].name,
              },
            },
            stepId: reactivation.id,
            showErrors: true,
            disabled: false,
          },
          type: 'message',
          position: {
            x: -520,
            y: 326,
          },
          selected: false,
        },
        {
          id: 'a9661283-1f16-4f2e-b61c-0fdf028cb6bd',
          type: 'jumpTo',
          data: {
            type: 'jumpTo',
            targetId: '97f37a62-0a53-4b97-8e3c-ef413fc4fa24',
            stepId: reactivationJumpTo.id,
            disabled: false,
          },
          position: {
            x: -520,
            y: 440,
          },
          selected: false,
        },
        {
          id: '059ee8e9-f27a-45b6-8660-8ba102eefaa0',
          type: 'message',
          data: {
            type: 'message',
            template: {
              type: 'email',
              selected: {
                id: templates[1].id,
                name: templates[1].name,
              },
            },
            stepId: newsletter.id,
            showErrors: true,
            disabled: false,
          },
          position: {
            x: 0,
            y: 326,
          },
          selected: false,
        },
        {
          id: 'aca80750-a8c1-4ed5-945e-f428145a31bc',
          type: 'jumpTo',
          data: {
            type: 'jumpTo',
            targetId: '97f37a62-0a53-4b97-8e3c-ef413fc4fa24',
            stepId: newsletterJumpTo.id,
            disabled: false,
          },
          position: {
            x: 0,
            y: 440,
          },
          selected: false,
        },
        {
          id: '7c27462f-7d05-4d1c-b586-f373ba348bb3',
          type: 'message',
          data: {
            type: 'message',
            template: {
              type: 'email',
              selected: {
                id: templates[2].id,
                name: templates[2].name,
              },
            },
            stepId: invoice.id,
            showErrors: true,
            disabled: false,
          },
          position: {
            x: 520,
            y: 326,
          },
          selected: false,
        },
        {
          id: '313bd3a7-b9d6-412a-9897-3d54eb4097ae',
          type: 'jumpTo',
          data: {
            type: 'jumpTo',
            targetId: '97f37a62-0a53-4b97-8e3c-ef413fc4fa24',
            stepId: invoiceJumpTo.id,
            disabled: false,
          },
          position: {
            x: 520,
            y: 440,
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

    await this.generateExampleOnboardingJourney(account, queryRunner, session);
    await this.generateExampleModalJourney(account, queryRunner, session);
    await this.generateExampleSingleCampaignJourney(
      account,
      queryRunner,
      session
    );
    await this.generateExampleSideChecklist(
      account,
      sidechecklistTemplate,
      queryRunner,
      session
    );
    await this.generateExampleThreeBranchEventJourney(
      account,
      [reactivationTemplate, newsTemplate, invoiceTemplate],
      queryRunner,
      session
    );
  }
}
