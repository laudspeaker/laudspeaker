import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import {
  Customer,
  CustomerDocument,
} from '../customers/schemas/customer.schema';
import { InjectModel } from '@nestjs/mongoose';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { Job, Queue } from 'bullmq';
import {
  FallBackAction,
  Template,
  TemplateType,
  WebhookData,
  WebhookMethod,
} from './entities/template.entity';
import {
  InjectQueue,
  OnQueueEvent,
  QueueEventsHost,
  QueueEventsListener,
} from '@nestjs/bullmq';
import { Installation } from '../slack/entities/installation.entity';
import { SlackService } from '../slack/slack.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { EventDto } from '../events/dto/event.dto';
import { Audience } from '../audiences/entities/audience.entity';
import { cleanTagsForSending } from '../../shared/utils/helpers';
import { MessageType } from '../email/email.processor';
import { Response, fetch } from 'undici';
import { Model } from 'mongoose';
import { Liquid } from 'liquidjs';
import { TestWebhookDto } from './dto/test-webhook.dto';
import { WebhooksService } from '../webhooks/webhooks.service';
import wait from '../../utils/wait';

@Injectable()
@QueueEventsListener('message')
export class TemplatesService extends QueueEventsHost {
  private tagEngine = new Liquid();

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(Template)
    public templatesRepository: Repository<Template>,
    @InjectModel(Customer.name) private customerModel: Model<CustomerDocument>,
    @InjectRepository(Audience)
    private audiencesRepository: Repository<Audience>,
    @Inject(SlackService) private slackService: SlackService,
    @Inject(WebhooksService) private webhooksService: WebhooksService,
    @InjectQueue('message') private readonly messageQueue: Queue,
    @InjectQueue('webhooks') private readonly webhooksQueue: Queue,
    @InjectQueue('slack') private readonly slackQueue: Queue
  ) {
    super();
  }

  @OnQueueEvent('active')
  onActive(args: { jobId: string; prev?: string }, id: string) {
    this.logger.debug(
      `${args.jobId} ${args.prev} ${id}`,
      `templates.service.ts:TemplatesService.onActive()`
    );
  }

  @OnQueueEvent('added')
  onAdded(args: { jobId: string; name: string }, id: string) {
    this.logger.debug(
      `${args.jobId} ${args.name} ${id}`,
      `templates.service.ts:TemplatesService.onAdded()`
    );
  }

  @OnQueueEvent('cleaned')
  onCleaned(args: { count: string }, id: string) {
    this.logger.debug(
      `${args.count} ${id}`,
      `templates.service.ts:TemplatesService.onCleaned()`
    );
  }

  @OnQueueEvent('completed')
  onCompleted(
    args: { jobId: string; returnvalue: string; prev?: string },
    id: string
  ) {
    this.logger.debug(
      `${args.jobId} ${args.returnvalue} ${args.prev} ${id}`,
      `templates.service.ts:TemplatesService.onCompleted()`
    );
  }

  @OnQueueEvent('delayed')
  onDelayed(args: { jobId: string; delay: number }, id: string) {
    this.logger.debug(
      `${args.jobId} ${args.delay} ${id}`,
      `templates.service.ts:TemplatesService.onDelayed()`
    );
  }

  @OnQueueEvent('drained')
  onDrained(id: string) {
    this.logger.debug(
      `${id}`,
      `templates.service.ts:TemplatesService.onDrained()`
    );
  }

  @OnQueueEvent('duplicated')
  onDuplicated(args: { jobId: string }, id: string) {
    this.logger.debug(
      `${args.jobId} ${id}`,
      `templates.service.ts:TemplatesService.onDuplicated()`
    );
  }

  @OnQueueEvent('error')
  onError(args: Error) {
    this.logger.debug(
      `${args}`,
      `templates.service.ts:TemplatesService.onError()`
    );
  }

  @OnQueueEvent('failed')
  onFailed(
    args: { jobId: string; failedReason: string; prev?: string },
    id: string
  ) {
    this.logger.debug(
      `${args.jobId} ${args.failedReason} ${args.prev} ${id}`,
      `templates.service.ts:TemplatesService.onFailed()`
    );
  }

  @OnQueueEvent('paused')
  onPaused(args: unknown, id: string) {
    this.logger.debug(
      `${id}`,
      `templates.service.ts:TemplatesService.onPaused()`
    );
  }

  @OnQueueEvent('progress')
  onProgress(args: { jobId: string; data: number | object }, id: string) {
    this.logger.debug(
      `${args.jobId} ${args.data} ${id}`,
      `templates.service.ts:TemplatesService.onProgress()`
    );
  }

  @OnQueueEvent('removed')
  onRemoved(args: { jobId: string; prev: string }, id: string) {
    this.logger.debug(
      `${args.jobId} ${args.prev} ${id}`,
      `templates.service.ts:TemplatesService.onRemoved()`
    );
  }

  @OnQueueEvent('resumed')
  onResumed(args: unknown, id: string) {
    this.logger.debug(
      `${id}`,
      `templates.service.ts:TemplatesService.onResumed()`
    );
  }

  @OnQueueEvent('retries-exhausted')
  onRetriesExhausted(
    args: { jobId: string; attemptsMade: string },
    id: string
  ) {
    this.logger.debug(
      `${args.jobId} ${args.attemptsMade} ${id}`,
      `templates.service.ts:TemplatesService.onRetriesExhausted()`
    );
  }

  @OnQueueEvent('stalled')
  onStalled(args: { jobId: string }, id: string) {
    this.logger.debug(
      `${args.jobId} ${id}`,
      `templates.service.ts:TemplatesService.onStalled()`
    );
  }

  @OnQueueEvent('waiting')
  onWaiting(args: { jobId: string; prev?: string }, id: string) {
    this.logger.debug(
      `${args.jobId} ${args.prev} ${id}`,
      `templates.service.ts:TemplatesService.onWaiting()`
    );
  }

  @OnQueueEvent('waiting-children')
  onWaitingChildren(args: { jobId: string }, id: string) {
    this.logger.debug(
      `${args.jobId} ${id}`,
      `templates.service.ts:TemplatesService.onWaitingChildren()`
    );
  }

  create(account: Account, createTemplateDto: CreateTemplateDto) {
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
      case TemplateType.FIREBASE:
        template.pushText = createTemplateDto.pushText;
        template.pushTitle = createTemplateDto.pushTitle;
        break;
      case TemplateType.WEBHOOK:
        template.webhookData = createTemplateDto.webhookData;
        break;
    }
    return this.templatesRepository.save({
      ...template,
      owner: { id: account.id },
    });
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
    customer: CustomerDocument,
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
    const { _id, ownerId, audiences, ...tags } = customer.toObject();

    const filteredTags = cleanTagsForSending(tags);

    const {
      mailgunAPIKey,
      sendingName,
      testSendingEmail,
      testSendingName,
      sendgridApiKey,
      sendgridFromEmail,
      email,
    } = account;
    let { sendingDomain, sendingEmail } = account;

    let key = mailgunAPIKey;
    let from = sendingName;

    switch (template.type) {
      case TemplateType.EMAIL:
        if (account.emailProvider === 'free3') {
          if (account.freeEmailsCount === 0)
            throw new HttpException(
              'You exceeded limit of 3 emails',
              HttpStatus.PAYMENT_REQUIRED
            );
          sendingDomain = process.env.MAILGUN_TEST_DOMAIN;
          key = process.env.MAILGUN_API_KEY;
          from = testSendingName;
          sendingEmail = testSendingEmail;
          account.freeEmailsCount--;
        }

        if (account.emailProvider === 'sendgrid') {
          key = sendgridApiKey;
          from = sendgridFromEmail;
        }

        job = await this.messageQueue.add(
          MessageType.EMAIL,
          {
            accountId: account.id,
            audienceId,
            cc: template.cc,
            customerId,
            domain: sendingDomain,
            email: sendingEmail,
            eventProvider: account.emailProvider,
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
            to: customer.phEmail ? customer.phEmail : customer.email,
          },
          { attempts: Number.MAX_SAFE_INTEGER }
        );
        if (account.emailProvider === 'free3') await account.save();
        break;
      case TemplateType.SLACK:
        try {
          installation = await this.slackService.getInstallation(customer);
        } catch (err) {
          return Promise.reject(err);
        }
        job = await this.slackQueue.add('send', {
          accountId: account.id,
          args: {
            audienceId,
            channel: customer.slackId,
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
        });
        break;
      case TemplateType.SMS:
        job = await this.messageQueue.add(MessageType.SMS, {
          accountId: account.id,
          audienceId,
          customerId,
          from: account.smsFrom,
          sid: account.smsAccountSid,
          tags: filteredTags,
          templateId: template.id,
          text: await this.parseApiCallTags(template.smsText, filteredTags),
          to: customer.phPhoneNumber || customer.phone,
          token: account.smsAuthToken,
          trackingEmail: email,
        });
        break;
      case TemplateType.FIREBASE:
        job = await this.messageQueue.add(MessageType.FIREBASE, {
          accountId: account.id,
          audienceId,
          customerId,
          firebaseCredentials: account.firebaseCredentials,
          phDeviceToken: customer.phDeviceToken,
          pushText: await this.parseApiCallTags(
            template.pushText,
            filteredTags
          ),
          pushTitle: await this.parseApiCallTags(
            template.pushTitle,
            filteredTags
          ),
          trackingEmail: email,
          tags: filteredTags,
          templateId: template.id,
        });
        break;
      case TemplateType.WEBHOOK:
        if (template.webhookData) {
          job = await this.webhooksQueue.add('whapicall', {
            template,
            filteredTags,
            audienceId,
            customerId,
            accountId: account.id,
          });
        }
        break;
    }
    return Promise.resolve(message ? message?.sid : job?.id);
  }

  async findAll(
    account: Account,
    take = 100,
    skip = 0,
    orderBy?: keyof Template,
    orderType?: 'asc' | 'desc',
    showDeleted?: boolean
  ): Promise<{ data: Template[]; totalPages: number }> {
    const totalPages = Math.ceil(
      (await this.templatesRepository.count({
        where: { owner: { id: account.id } },
      })) / take || 1
    );
    const orderOptions = {};
    if (orderBy && orderType) {
      orderOptions[orderBy] = orderType;
    }
    const templates = await this.templatesRepository.find({
      where: {
        owner: { id: account.id },
        isDeleted: In([!!showDeleted, false]),
      },
      order: orderOptions,
      take: take < 100 ? take : 100,
      skip,
    });
    return { data: templates, totalPages };
  }

  findOne(account: Account, name: string): Promise<Template> {
    return this.templatesRepository.findOneBy({
      owner: { id: account.id },
      name,
    });
  }

  findOneById(account: Account, id: string): Promise<Template> {
    return this.templatesRepository.findOneBy({
      owner: { id: account.id },
      id: id,
    });
  }

  findBy(account: Account, type: TemplateType): Promise<Template[]> {
    return this.templatesRepository.findBy({
      owner: { id: account.id },
      type: type,
    });
  }

  update(account: Account, name: string, updateTemplateDto: UpdateTemplateDto) {
    return this.templatesRepository.update(
      { owner: { id: (<Account>account).id }, name: name },
      { ...updateTemplateDto }
    );
  }

  async remove(account: Account, id: string): Promise<void> {
    await this.templatesRepository.update(
      {
        owner: { id: (<Account>account).id },
        id,
      },
      { isDeleted: true }
    );
  }

  async duplicate(account: Account, name: string) {
    const foundTemplate = await this.templatesRepository.findOne({
      where: {
        owner: { id: account.id },
        name,
      },
      relations: ['owner'],
    });
    if (!foundTemplate) throw new NotFoundException('Template not found');

    const {
      owner,
      slackMessage,
      style,
      subject,
      text,
      type,
      smsText,
      webhookData,
    } = foundTemplate;

    const ownerId = owner.id;

    let copyEraseIndex = foundTemplate.name.indexOf('-copy');
    if (copyEraseIndex === -1) copyEraseIndex = foundTemplate.name.length;

    const res = await this.templatesRepository
      .createQueryBuilder()
      .select('COUNT(*)')
      .where('starts_with(name, :oldName) = TRUE AND "ownerId" = :ownerId', {
        oldName: foundTemplate.name.substring(0, copyEraseIndex),
        ownerId: account.id,
      })
      .execute();

    const newName =
      foundTemplate.name.substring(0, copyEraseIndex) +
      '-copy-' +
      (res?.[0]?.count || '0');

    await this.templatesRepository.save({
      name: newName,
      owner: { id: ownerId },
      slackMessage,
      style,
      subject,
      text,
      type,
      smsText,
      webhookData,
    });
  }

  async findUsedInJourneys(account: Account, id: string) {
    const template = await this.templatesRepository.findOneBy({
      id,
      owner: { id: account.id },
    });
    if (!template) throw new NotFoundException('Template not found');

    const data = await this.audiencesRepository
      .createQueryBuilder('audience')
      .select(`DISTINCT(workflow."name")`)
      .leftJoin(
        'audience_templates_template',
        'audience_templates_template',
        'audience_templates_template."audienceId" = audience.id'
      )
      .leftJoin('workflow', 'workflow', 'workflow.id = audience."workflowId"')
      .where(
        `workflow."isDeleted" = false AND audience."ownerId" = :ownerId AND audience_templates_template."templateId" = :templateId`,
        { ownerId: account.id, templateId: template.id }
      )
      .execute();

    return data.map((item) => item.name);
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

  async testWebhookTemplate(testWebhookDto: TestWebhookDto) {
    const customer = await this.customerModel.findOne({
      email: testWebhookDto.testCustomerEmail,
    });

    //console.log("yo")
    if (!customer) throw new NotFoundException('Customer not found');

    const { _id, ownerId, audiences, ...tags } = customer.toObject();
    //console.log("tags before filtering are " , tags);
    const filteredTags = cleanTagsForSending(tags);

    //console.log("filteredTags are ", JSON.stringify(filteredTags, null, 2));
    //console.log("url is ", url);

    const { method } = testWebhookDto.webhookData;

    let { body, headers, url } = testWebhookDto.webhookData;

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
      //console.log("filteredbody are ", JSON.stringify(body, null, 2));
      body = await this.tagEngine.parseAndRender(body, filteredTags || {}, {
        strictVariables: true,
      });
      //console.log("filteredbody is now ", JSON.stringify(body, null, 2));

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
