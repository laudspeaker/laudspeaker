import {
  Injectable,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, Repository } from 'typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { BaseJwtHelper } from '../../common/helper/base-jwt.helper';
import { DEFAULT_TEMPLATES } from '@/fixtures/user.default.templates';
import { Template } from '../templates/entities/template.entity';
import {
  ProviderTypes,
  TriggerType,
  Workflow,
} from '../workflows/entities/workflow.entity';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common/services';
import { Inject } from '@nestjs/common/decorators';
import { Audience } from '../audiences/entities/audience.entity';
import { randomUUID } from 'crypto';

@Injectable()
export class AuthHelper extends BaseJwtHelper {
  @InjectRepository(Account)
  private readonly repository: Repository<Account>;
  @InjectRepository(Template)
  private templateRepository: Repository<Template>;
  @InjectRepository(Workflow)
  private workflowRepository: Repository<Workflow>;
  @InjectRepository(Audience)
  private audienceRepository: Repository<Audience>;
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
    transactionManager: EntityManager
  ) {
    let ret = new Workflow();
    ret.name = 'example-onboarding';
    ret.owner = account;
    ret = await transactionManager.save(ret);
    this.logger.debug('Created workflow: ' + ret?.id);

    const data = await Promise.all(
      [
        {
          name: 'Pre-Signup',
          customers: [],
          templates: [],
          isDynamic: true,
          isPrimary: true,
          inclusionCriteria: undefined,
          description:
            "User hasn't created an account yet. When a user creates an account, we receive the SignUp event, and they are moved to the next step in the Journey, where they will be sent a message. Users that we have never seen before are added to this step, and then we process their associated SignUp event.",
          owner: account,
        },
        {
          name: 'Post-Signup',
          customers: [],
          templates: [],
          isDynamic: false,
          isPrimary: false,
          inclusionCriteria: undefined,
          description:
            'In this step, triggered immediately after the SignUp event, users are sent a Welcome Email. You can see the all available templates under the Templates tab in the Side Navigation Menu.',
          owner: account,
        },
      ].map(async (el) => {
        const { name, customers, templates, isPrimary, description, owner } =
          el;

        const audience = new Audience();
        audience.name = name;
        audience.customers = customers;
        audience.templates = templates;
        audience.isPrimary = isPrimary;
        audience.description = description;
        audience.owner = owner;
        audience.workflow = ret;

        const resp = await transactionManager.save(audience);

        return resp;
      })
    );

    const nodeIds = [randomUUID(), randomUUID()];
    const triggerId = randomUUID();
    const eventName = 'SignUp';

    const defRules = [
      {
        type: 0,
        source: data[0].id,
        dest: [data[1].id],
        providerType: 'custom',
        properties: {
          conditions: [
            {
              key: 'Event',
              comparisonType: 'isEqual',
              type: 'String',
              value: eventName,
              relationWithNext: 'and',
              isArray: false,
            },
          ],
        },
      },
    ];

    const rules: string[] = [];
    for (let index = 0; index < defRules?.length; index++)
      rules.push(
        Buffer.from(JSON.stringify(defRules[index])).toString('base64')
      );

    ret.rules = rules;
    ret.visualLayout = {
      edges: [
        {
          source: nodeIds[0],
          sourceHandle: triggerId,
          target: nodeIds[1],
          targetHandle: null,
          id: randomUUID(),
          markerEnd: {
            type: 'arrow',
            strokeWidth: 2,
            height: 20,
            width: 20,
          },
          type: 'smoothstep',
        },
      ],
      nodes: [
        {
          id: nodeIds[0],
          data: {
            nodeId: nodeIds[0],
            primary: true,
            triggers: [
              {
                id: triggerId,
                properties: {
                  conditions: [
                    {
                      key: 'Event',
                      comparisonType: 'isEqual',
                      type: 'String',
                      value: eventName,
                      relationWithNext: 'and',
                      isArray: false,
                    },
                  ],
                },
                providerType: ProviderTypes.Custom,
                title: 'Event Based',
                type: TriggerType.EVENT,
              },
            ],
            messages: [],
            audienceId: data[0].id,
            isSelected: false,
            needsUpdate: true,
            dataTriggers: [],
          },
          type: 'special',
          width: 350,
          height: 79,
          dragging: false,
          position: {
            x: 252,
            y: 231,
          },
          selected: false,
          positionAbsolute: {
            x: 252,
            y: 231,
          },
        },
        {
          id: nodeIds[1],
          data: {
            nodeId: nodeIds[1],
            primary: true,
            triggers: [],
            messages: [],
            audienceId: data[1].id,
            isSelected: false,
            needsUpdate: true,
            dataTriggers: [
              {
                id: triggerId,
                properties: {
                  conditions: [
                    {
                      key: 'Event',
                      comparisonType: 'isEqual',
                      type: 'String',
                      value: eventName,
                      relationWithNext: 'and',
                      isArray: false,
                    },
                  ],
                },
                providerType: ProviderTypes.Custom,
                title: 'Event Based',
                type: TriggerType.EVENT,
              },
            ],
          },
          type: 'special',
          width: 350,
          height: 79,
          dragging: false,
          position: {
            x: 252,
            y: 531,
          },
          selected: false,
          positionAbsolute: {
            x: 252,
            y: 531,
          },
        },
      ],
    };
    await transactionManager.save(ret);
  }

  private async generateExampleSingleCampaignJourney(
    account: Account,
    transactionManager: EntityManager
  ) {
    let ret = new Workflow();
    ret.name = 'example-single-campaign';
    ret.owner = account;
    ret = await transactionManager.save(ret);
    this.logger.debug('Created workflow: ' + ret?.id);

    const data = await Promise.all(
      [
        {
          name: 'One-Off Broadcast',
          customers: [],
          templates: [],
          isDynamic: false,
          isPrimary: true,
          inclusionCriteria: undefined,
          description:
            "This email is sent to all your customers that exist at the moment that the Journey is started and meet the crtiteria for this Journey. It is not sent to customers who's profiles are created after this Journey is started (Static Journey).",
          owner: account,
        },
      ].map(async (el) => {
        const { name, customers, templates, isPrimary, description, owner } =
          el;

        const audience = new Audience();
        audience.name = name;
        audience.customers = customers;
        audience.templates = templates;
        audience.isPrimary = isPrimary;
        audience.description = description;
        audience.owner = owner;
        audience.workflow = ret;

        const resp = await transactionManager.save(audience);
        return resp;
      })
    );

    const nodeId = randomUUID();

    ret.visualLayout = {
      edges: [],
      nodes: [
        {
          id: nodeId,
          data: {
            nodeId: nodeId,
            primary: true,
            triggers: [],
            messages: [],
            audienceId: data[0].id,
            isSelected: false,
            needsUpdate: true,
            dataTriggers: [],
          },
          type: 'special',
          width: 350,
          height: 79,
          dragging: false,
          position: {
            x: 252,
            y: 231,
          },
          selected: false,
          positionAbsolute: {
            x: 252,
            y: 231,
          },
        },
      ],
    };
    await transactionManager.save(ret);
  }

  // generate default templates and workflows for newly registered user
  public async generateDefaultData(
    account: Account,
    transactionManager: EntityManager
  ) {
    await transactionManager.save<Template>(
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

    await this.generateExampleOnboardingJourney(account, transactionManager);
    await this.generateExampleSingleCampaignJourney(
      account,
      transactionManager
    );
  }
}
