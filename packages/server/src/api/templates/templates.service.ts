import {
  BadRequestException,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, QueryRunner, Like, Repository, FindManyOptions } from 'typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import {
  FallBackAction,
  MIMEType,
  Template,
  TemplateType,
  WebhookData,
  WebhookMethod,
} from './entities/template.entity';
import { Job } from 'bullmq';
import { Installation } from '../slack/entities/installation.entity';
import { SlackService } from '../slack/slack.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { EventDto } from '../events/dto/event.dto';
import { cleanTagsForSending } from '../../shared/utils/helpers';
import { MessageType } from '../email/email.processor';
import { Response, fetch } from 'undici';
import { Liquid } from 'liquidjs';
import { format, parseISO } from 'date-fns';
import { TestWebhookDto } from './dto/test-webhook.dto';
import wait from '../../utils/wait';
import { ModalsService } from '../modals/modals.service';
import { CacheService } from '../../common/services/cache.service';
import { QueueType } from '../../common/services/queue/types/queue-type';
import { Producer } from '../../common/services/queue/classes/producer';
import { Customer } from '../customers/entities/customer.entity';
import { CustomersService } from '../customers/customers.service';
import { WebsocketGateway } from '../../websockets/websocket.gateway';
import { CacheConstants } from '../../common/services/cache.constants';

@Injectable()
export class TemplatesService {
  private tagEngine = new Liquid();

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @InjectRepository(Template)
    public templatesRepository: Repository<Template>,
    @Inject(SlackService) private slackService: SlackService,
    @Inject(ModalsService) private modalsService: ModalsService,
    @Inject(CacheService) private cacheService: CacheService,
    @Inject(forwardRef(()=>CustomersService)) private customersService: CustomersService
  ) {
    this.tagEngine.registerFilter('date', (input, formatString) => {
      const date = input === 'now' ? new Date() : parseISO(input);
      // Adjust the formatString to fit JavaScript's date formatting if necessary
      const adjustedFormatString = formatString
        .replace(/%Y/g, 'yyyy')
        .replace(/%m/g, 'MM')
        .replace(/%d/g, 'dd')
        .replace(/%H/g, 'HH')
        .replace(/%M/g, 'mm')
        .replace(/%S/g, 'ss');
      return format(date, adjustedFormatString);
    });
    this.tagEngine.registerTag('api_call', {
      parse(token) {
        this.items = token.args.split(' ');
      },
      async render(ctx) {
        const url = this.liquid.parseAndRenderSync(
          this.items[0],
          ctx.getAll(),
          ctx.opts
        );

        try {
          const res = await fetch(url, { method: 'GET' });

          if (res.status !== 200)
            throw new Error('Error while processing api_call tag');

          const data = res.headers
            .get('Content-Type')
            .includes('application/json')
            ? await res.json()
            : await res.text();

          if (this.items[1] === ':save' && this.items[2]) {
            ctx.push({ [this.items[2]]: data });
          }
        } catch (e) {
          throw new Error('Error while processing api_call tag');
        }
      },
    });
  }

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: TemplatesService.name,
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
        class: TemplatesService.name,
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
        class: TemplatesService.name,
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
        class: TemplatesService.name,
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
        class: TemplatesService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  create(
    account: Account,
    createTemplateDto: CreateTemplateDto,
    session: string
  ) {
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    try {
      const template = new Template();
      template.type = createTemplateDto.type;
      template.name = createTemplateDto.name;
      switch (template.type) {
        case TemplateType.EMAIL:
          template.subject = createTemplateDto.subject;
          template.text = createTemplateDto.text;
          if (createTemplateDto.cc) template.cc = createTemplateDto.cc;
          template.style = createTemplateDto.style;
          break;
        case TemplateType.SLACK:
          template.slackMessage = createTemplateDto.slackMessage;
          break;
        case TemplateType.SMS:
          template.smsText = createTemplateDto.smsText;
          break;
        case TemplateType.PUSH:
          // UPDATE WITH PUSH LOGIC
          break;
        case TemplateType.WEBHOOK:
          template.webhookData = createTemplateDto.webhookData;
          if (template.webhookData)
            template.webhookData.mimeType ||= MIMEType.JSON;
          break;
        case TemplateType.MODAL:
          template.modalState = createTemplateDto.modalState;
          break;
        case TemplateType.CUSTOM_COMPONENT:
          template.customEvents = createTemplateDto.customEvents;
          template.customFields = createTemplateDto.customFields;
          break;
      }
      return this.templatesRepository.save({
        ...template,
        workspace: { id: workspace.id },
      });
    } catch (error) {
      this.logger.error(`Api error: ${error}`);
    }
  }

  /**
   * Queues a message up to be sent to a customer using a template.
   *
   *  @remarks
   * If either the customer is not found or the template is not found
   * this will return an error.
   *
   * @param account - The owner of the audience
   * @param templateId - ID of template to send
   * @param customerId - ID of customer to send to
   *
   */
  async queueMessage(
    account: Account,
    templateId: string,
    customer: Customer,
    event: EventDto,
    audienceId?: string
  ): Promise<string | number> {
    const customerId = customer.id;
    let template: Template,
      job: Job<any>, // created jobId
      installation: Installation,
      message: any;
    try {
      template = await this.findOneById(account, templateId);
      this.logger.debug(
        'Found template: ' + template.id + ' of type ' + template.type
      );
    } catch (err) {
      return Promise.reject(err);
    }
    const { id, ...tags } = customer;

    const filteredTags = cleanTagsForSending(tags);

    const { email } = account;

    const workspace = account.teams?.[0]?.organization?.workspaces?.[0];

    const {
      mailgunAPIKey,
      sendingName,
      testSendingEmail,
      testSendingName,
      sendgridApiKey,
      sendgridFromEmail,
    } = workspace;

    let { sendingDomain, sendingEmail } = workspace;

    let key = mailgunAPIKey;
    let from = sendingName;

    switch (template.type) {
      case TemplateType.EMAIL:
        if (workspace.emailProvider === 'free3') {
          if (workspace.freeEmailsCount === 0)
            throw new HttpException(
              'You exceeded limit of 3 emails',
              HttpStatus.PAYMENT_REQUIRED
            );
          sendingDomain = process.env.MAILGUN_TEST_DOMAIN;
          key = process.env.MAILGUN_API_KEY;
          from = testSendingName;
          sendingEmail = testSendingEmail;
          workspace.freeEmailsCount--;
        }

        if (workspace.emailProvider === 'sendgrid') {
          key = sendgridApiKey;
          from = sendgridFromEmail;
        }

        await Producer.add(QueueType.MESSAGE, {
            accountId: account.id,
            audienceId,
            cc: template.cc,
            customerId,
            domain: sendingDomain,
            email: sendingEmail,
            eventProvider: workspace.emailProvider,
            from,
            trackingEmail: email,
            key,
            subject: await this.parseApiCallTags(
              template.subject,
              filteredTags
            ),
            tags: filteredTags,
            templateId,
            text: await this.parseApiCallTags(template.text, filteredTags),
            to: customer.user_attributes.phEmail ? customer.user_attributes.phEmail : customer.user_attributes.email,
          }, MessageType.EMAIL);
        if (workspace.emailProvider === 'free3') {
          await account.save();
          await workspace.save();
        }
        break;
      case TemplateType.SLACK:
        try {
          installation = await this.slackService.getInstallation(customer);
        } catch (err) {
          return Promise.reject(err);
        }
        await Producer.add(QueueType.SLACK, {
          accountId: account.id,
          args: {
            audienceId,
            channel: customer.user_attributes.slackId,
            customerId,
            tags: filteredTags,
            templateId,
            text: await this.parseApiCallTags(
              event?.payload ? event.payload : template.slackMessage,
              filteredTags
            ),
          },
          methodName: 'chat.postMessage',
          token: installation.installation.bot.token,
          trackingEmail: email,
        }, 'send');
        break;
      case TemplateType.SMS:
        await Producer.add(QueueType.MESSAGE, {
          accountId: account.id,
          audienceId,
          customerId,
          from: workspace.smsFrom,
          sid: workspace.smsAccountSid,
          tags: filteredTags,
          templateId: template.id,
          text: await this.parseApiCallTags(template.smsText, filteredTags),
          to: customer.user_attributes.phPhoneNumber || customer.user_attributes.phone,
          token: workspace.smsAuthToken,
          trackingEmail: email,
        }, MessageType.SMS);
        break;
      case TemplateType.PUSH:
        // TODO: update for PUSH
        // await this.messageQueue.add(MessageType.PUSH_FIREBASE, {
        //   accountId: account.id,
        //   audienceId,
        //   customerId,
        //   firebaseCredentials: account.firebaseCredentials,
        //   phDeviceToken: customer.phDeviceToken,
        //   pushText: await this.parseApiCallTags(
        //     template.pushText,
        //     filteredTags
        //   ),
        //   pushTitle: await this.parseApiCallTags(
        //     template.pushTitle,
        //     filteredTags
        //   ),
        //   trackingEmail: email,
        //   tags: filteredTags,
        //   templateId: template.id,
        // });
        break;
      case TemplateType.WEBHOOK:
        if (template.webhookData) {
          await Producer.add(QueueType.WEBHOOKS, {
            template,
            filteredTags,
            audienceId,
            customerId,
            accountId: account.id,
          });
        }
        break;
      case TemplateType.MODAL:
        // if (template.modalState) {
        //   const isSent = await this.websocketGateway.sendModal(
        //     customerId.toString(),
        //     template
        //   );
        //   if (!isSent)
        //     await this.modalsService.queueModalEvent(customerId.toString(), template);
        // }
        break;
    }
    return Promise.resolve(message ? message?.sid : job?.id);
  }

  async findAll(
    account: Account,
    session: string,
    take = 100,
    skip = 0,
    search = '',
    orderBy?: keyof Template,
    orderType?: 'asc' | 'desc',
    showDeleted?: boolean,
    type?: TemplateType | TemplateType[]
  ): Promise<{ data: Template[]; totalPages: number }> {
    const typeConvertedCheck: FindManyOptions<Template>['where'] = {};

    if (Array.isArray(type)) {
      typeConvertedCheck.type = In(type);
    } else {
      typeConvertedCheck.type = type;
    }
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    const totalPages = Math.ceil(
      (await this.templatesRepository.count({
        where: {
          name: Like(`%${search}%`),
          workspace: {
            id: workspace.id,
          },
          isDeleted: In([!!showDeleted, false]),
          ...typeConvertedCheck,
        },
      })) / take || 1
    );
    const orderOptions = {};
    if (orderBy && orderType) {
      orderOptions[orderBy] = orderType;
    }
    const templates = await this.templatesRepository.find({
      where: {
        name: Like(`%${search}%`),
        workspace: {
          id: workspace.id,
        },
        isDeleted: In([!!showDeleted, false]),
        ...typeConvertedCheck,
      },
      order: orderOptions,
      take: take < 100 ? take : 100,
      skip,
    });
    return { data: templates, totalPages };
  }

  findOne(account: Account, name: string, session: string): Promise<Template> {
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    return this.templatesRepository.findOneBy({
      workspace: {
        id: workspace.id,
      },
      name,
    });
  }

  findOneById(account: Account, id: string): Promise<Template> {
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    return this.templatesRepository.findOneBy({
      workspace: {
        id: workspace.id,
      },
      id: id,
    });
  }

  async transactionalFindOneById(
    account: Account,
    id: string,
    queryRunner: QueryRunner
  ): Promise<Template> {
    return queryRunner.manager.findOneBy(Template, {
      id: id,
    });
  }

  /**
   * Find a template by its ID, dont load any relations
   * @param id
   * @param queryRunner
   * @returns
   */
  async lazyFindByID(
    id: string,
    queryRunner?: QueryRunner
  ): Promise<Template | null> {
    if (queryRunner) {
      return await queryRunner.manager.findOne(Template, {
        where: {
          id: id,
        },
      });
    } else {
      return await this.templatesRepository.findOne({
        where: {
          id: id,
        },
      });
    }
  }

  findBy(account: Account, type: TemplateType): Promise<Template[]> {
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    return this.templatesRepository.findBy({
      workspace: {
        id: workspace.id,
      },
      type: type,
    });
  }

  async update(
    account: Account,
    id: string,
    updateTemplateDto: UpdateTemplateDto,
    session: string
  ) {
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    await this.cacheService.delete(CacheConstants.TEMPLATES, id);

    return this.templatesRepository.update(
      { workspace: { id: workspace.id }, id },
      { ...updateTemplateDto, updatedAt: new Date() }
    );
  }

  async remove(account: Account, id: string, session: string): Promise<void> {
    const workspace = account?.teams?.[0]?.organization?.workspaces?.[0];

    await this.templatesRepository.update(
      {
        workspace: { id: workspace.id },
        id,
      },
      { isDeleted: true, updatedAt: new Date() }
    );
  }

  async duplicate(account: Account, id: string, session: string) {
    const workspaceFromAccount =
      account?.teams?.[0]?.organization?.workspaces?.[0];

    const foundTemplate = await this.templatesRepository.findOne({
      where: {
        workspace: { id: workspaceFromAccount.id },

        id,
      },
      relations: ['workspace'],
    });
    if (!foundTemplate) throw new NotFoundException('Template not found');

    const {
      workspace,
      slackMessage,
      style,
      subject,
      text,
      type,
      smsText,
      webhookData,
      pushObject,
      modalState,
      customEvents,
      customFields,
    } = foundTemplate;

    const workspaceId = workspace.id;

    let copyEraseIndex = foundTemplate.name.indexOf('-copy');
    if (copyEraseIndex === -1) copyEraseIndex = foundTemplate.name.length;

    const res = await this.templatesRepository
      .createQueryBuilder()
      .select('COUNT(*)')
      .where(
        'starts_with(name, :oldName) = TRUE AND "workspaceId" = :workspaceId',
        {
          oldName: foundTemplate.name.substring(0, copyEraseIndex),
          workspaceId: workspaceId,
        }
      )
      .execute();

    const newName =
      foundTemplate.name.substring(0, copyEraseIndex) +
      '-copy-' +
      (res?.[0]?.count || '0');

    const tmp = await this.templatesRepository.save({
      name: newName,
      workspace: { id: workspaceId },
      slackMessage,
      style,
      subject,
      text,
      type,
      smsText,
      pushObject,
      webhookData,
      modalState,
      customEvents,
      customFields,
    });

    return { id: tmp.id };
  }

  public async parseTemplateTags(str: string) {
    this.logger.debug('Parsing template tags...');

    const matches = str.match(
      /\[\[\s(email|sms|slack|firebase);[a-zA-Z0-9-\s]+;[a-zA-Z]+\s\]\]/g
    );

    if (!matches) return str;

    for (const match of matches) {
      const [type, templateName, templateProperty] = match
        .replace('[[ ', '')
        .replace(' ]]', '')
        .trim()
        .split(';');

      const template = await this.templatesRepository.findOneBy({
        type: <TemplateType>type,
        name: templateName,
      });

      if (template) this.logger.debug('Found template: ' + template.name);

      str = str.replace(match, template?.[templateProperty] || '');
    }

    return str;
  }

  private recursivelyRetrieveData(
    object: unknown,
    path: string[]
  ): string | null {
    if (!object) return null;

    const key = path.shift();
    if (!key)
      return typeof object === 'object'
        ? JSON.stringify(object)
        : String(object);
    return this.recursivelyRetrieveData(object[key], path);
  }

  public async parseApiCallTags(
    str: string,
    filteredTags: { [key: string]: any } = {}
  ) {
    const matches = str.match(/\[\{\[\s[^\s]+;[^\s]+\s\]\}\]/);

    if (!matches) return str;

    for (const match of matches) {
      try {
        const [webhookDataBase64, webhookProps] = match
          .replace('[{[ ', '')
          .replace(' ]}]', '')
          .trim()
          .split(';');
        const webhookData: WebhookData = JSON.parse(
          Buffer.from(webhookDataBase64, 'base64').toString('utf8')
        );

        const { body, error, headers, success } = await this.handleApiCall(
          webhookData,
          filteredTags
        );

        if (!success) return str.replace(match, '');

        const webhookPath = webhookProps.replace('response.', '').split('.');

        let retrievedData = '';
        if (webhookPath.length === 1) {
          retrievedData = ['data', 'body'].includes(webhookPath[0])
            ? body
            : webhookPath[0] === 'headers'
            ? JSON.stringify(headers)
            : '';
        } else {
          const objectToRetrievе = ['data', 'body'].includes(webhookPath[0])
            ? JSON.parse(body)
            : webhookPath[0] === 'headers'
            ? headers
            : {};
          retrievedData = this.recursivelyRetrieveData(
            objectToRetrievе,
            webhookPath.slice(1)
          );
        }

        str = str.replace(match, retrievedData);
      } catch (e) {
        this.logger.error('Api call error: ' + e);
      }
    }

    return str;
  }

  async testWebhookTemplate(testWebhookDto: TestWebhookDto, session: string) {
    let customer = await this.customersService.findByCustomerIdUnauthenticated(testWebhookDto.testCustomerId);

    if (!customer) {
      customer = new Customer();
    }

    const { id, ...tags } = customer.toObject();
    const filteredTags = cleanTagsForSending(tags);

    const { method, mimeType } = testWebhookDto.webhookData;

    let { body, headers, url } = testWebhookDto.webhookData;

    try {
      url = await this.tagEngine.parseAndRender(url, filteredTags || {}, {
        strictVariables: true,
      });

      url = await this.parseTemplateTags(url);

      if (
        [
          WebhookMethod.GET,
          WebhookMethod.HEAD,
          WebhookMethod.DELETE,
          WebhookMethod.OPTIONS,
        ].includes(method)
      ) {
        body = undefined;
      } else {
        body = await this.parseTemplateTags(body);
        body = await this.tagEngine.parseAndRender(body, filteredTags || {}, {
          strictVariables: true,
        });
      }

      headers = Object.fromEntries(
        await Promise.all(
          Object.entries(headers).map(async ([key, value]) => [
            await this.parseTemplateTags(
              await this.tagEngine.parseAndRender(key, filteredTags || {}, {
                strictVariables: true,
              })
            ),
            await this.parseTemplateTags(
              await this.tagEngine.parseAndRender(value, filteredTags || {}, {
                strictVariables: true,
              })
            ),
          ])
        )
      );
    } catch (e) {
      if (e instanceof Error) {
        throw new BadRequestException(e.message);
      }
    }

    headers['content-type'] = mimeType;

    try {
      const res = await fetch(url, {
        method,
        body,
        headers,
      });

      return {
        body: await res.text(),
        headers: res.headers,
        status: res.status,
      };
    } catch (e) {
      throw new BadRequestException(e);
    }
  }

  public async handleApiCall(
    webhookData: WebhookData,
    filteredTags: { [key: string]: any } = {}
  ) {
    const { method, retries, fallBackAction } = webhookData;

    let { body, headers, url } = webhookData;

    url = await this.tagEngine.parseAndRender(url, filteredTags || {}, {
      strictVariables: true,
    });
    url = await this.parseTemplateTags(url);

    if (
      [
        WebhookMethod.GET,
        WebhookMethod.HEAD,
        WebhookMethod.DELETE,
        WebhookMethod.OPTIONS,
      ].includes(method)
    ) {
      body = undefined;
    } else {
      body = await this.parseTemplateTags(body);
      body = await this.tagEngine.parseAndRender(body, filteredTags || {}, {
        strictVariables: true,
      });
    }

    headers = Object.fromEntries(
      await Promise.all(
        Object.entries(headers).map(async ([key, value]) => [
          await this.parseTemplateTags(
            await this.tagEngine.parseAndRender(key, filteredTags || {}, {
              strictVariables: true,
            })
          ),
          await this.parseTemplateTags(
            await this.tagEngine.parseAndRender(value, filteredTags || {}, {
              strictVariables: true,
            })
          ),
        ])
      )
    );

    let retriesCount = 0;
    let success = false;

    this.logger.debug(
      'Sending api call request: \n' + JSON.stringify(webhookData, null, 2)
    );
    let error: string | null = null;
    let res: Response;
    while (!success && retriesCount < retries) {
      try {
        res = await fetch(url, {
          method,
          body,
          headers,
        });

        if (!res.ok) throw new Error('Error sending API request');
        this.logger.debug('Successful api call request!');
        success = true;
      } catch (e) {
        retriesCount++;
        this.logger.warn(
          'Unsuccessfull webhook request. Retries: ' +
            retriesCount +
            '. Error: ' +
            e
        );
        if (e instanceof Error) error = e.message;
        await wait(5000);
      }
    }

    if (!success) {
      switch (fallBackAction) {
        case FallBackAction.NOTHING:
          this.logger.error('Failed to send webhook request: ' + error);
          break;
      }
    }

    return { success, body: await res.text(), headers: res.headers, error };
  }
}
