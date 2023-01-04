import {
  Injectable,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { BaseJwtHelper } from '../../common/helper/base-jwt.helper';
import { DEFAULT_TEMPLATES } from '@/fixtures/user.default.templates';
import { Template } from '../templates/entities/template.entity';
import { Workflow } from '../workflows/entities/workflow.entity';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common/services';
import { Inject } from '@nestjs/common/decorators';
import { Audience } from '../audiences/entities/audience.entity';
import { Stats } from '../audiences/entities/stats.entity';
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
  @InjectRepository(Stats)
  private statsRepository: Repository<Stats>;
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
  public async validateUser(decoded: any): Promise<Account> {
    return this.repository.findOne({ where: { id: decoded.id } });
  }

  // Generate JWT Token
  public generateToken(user: Account): string {
    return this.jwt.sign({ id: user.id, email: user.email });
  }

  // Validate JWT Token, throw forbidden error if JWT Token is invalid
  private async validate(token: string): Promise<boolean | never> {
    const decoded: unknown = this.jwt.verify(token);

    if (!decoded) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    const user: Account = await this.validateUser(decoded);

    if (!user) {
      throw new UnauthorizedException();
    }

    return true;
  }

  private async generateExampleOnboardingJourney(userId: string) {
    const workflow = new Workflow();
    workflow.name = 'example-onboarding';
    workflow.audiences = [];
    workflow.ownerId = userId;
    let ret: Workflow;
    try {
      ret = await this.workflowRepository.save(workflow);
      this.logger.debug('Created workflow: ' + ret?.id);
    } catch (err) {
      this.logger.error('Error: ' + err);
    }

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
          ownerId: userId,
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
          ownerId: userId,
        },
      ].map(async (el) => {
        const audience = new Audience();
        audience.name = el.name;
        audience.customers = el.customers;
        audience.templates = el.templates;
        audience.isPrimary = el.isPrimary;
        audience.description = el.description;
        audience.ownerId = el.ownerId;

        const resp = await this.audienceRepository.save(audience);
        const stats = this.statsRepository.create({ audience: resp });
        await this.statsRepository.save(stats);
        return resp;
      })
    );

    const nodeIds = [randomUUID(), randomUUID()];
    const triggerId = randomUUID();
    const eventName = 'SignUp';

    ret.audiences = data.map((el) => el.id);

    const defRules = [
      {
        type: 0,
        source: data[0].id,
        dest: [data[1].id],
        properties: {
          conditions: {
            key: eventName,
            comparisonType: 'isEqual',
            type: 'String',
            value: eventName,
            relationWithNext: 'and',
          },
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
                      key: eventName,
                      comparisonType: 'isEqual',
                      type: 'String',
                      value: eventName,
                      relationWithNext: 'and',
                    },
                  ],
                },
                title: 'Event Based',
                type: 'eventBased',
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
                      key: eventName,
                      comparisonType: 'isEqual',
                      type: 'String',
                      value: eventName,
                      relationWithNext: 'and',
                    },
                  ],
                },
                title: 'Event Based',
                type: 'eventBased',
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
    await this.workflowRepository.save(ret);
  }

  private async generateExampleSingleCampaignJourney(userId: string) {
    const workflow = new Workflow();
    workflow.name = 'example-single-campaign';
    workflow.audiences = [];
    workflow.ownerId = userId;
    let ret: Workflow;
    try {
      ret = await this.workflowRepository.save(workflow);
      this.logger.debug('Created workflow: ' + ret?.id);
    } catch (err) {
      this.logger.error('Error: ' + err);
    }

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
          ownerId: userId,
        },
      ].map(async (el) => {
        const audience = new Audience();
        audience.name = el.name;
        audience.customers = el.customers;
        audience.templates = el.templates;
        audience.isPrimary = el.isPrimary;
        audience.description = el.description;
        audience.ownerId = el.ownerId;

        const resp = await this.audienceRepository.save(audience);
        const stats = this.statsRepository.create({ audience: resp });
        await this.statsRepository.save(stats);
        return resp;
      })
    );

    const nodeId = randomUUID();

    ret.audiences = data.map((el) => el.id);

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
    await this.workflowRepository.save(ret);
  }

  // generate default templates and workflows for newly registered user
  public async generateDefaultData(userId: string) {
    await this.templateRepository.insert(
      DEFAULT_TEMPLATES.map((el) => ({ ...el, ownerId: userId }))
    );

    await this.generateExampleOnboardingJourney(userId);
    await this.generateExampleSingleCampaignJourney(userId);
  }
}
