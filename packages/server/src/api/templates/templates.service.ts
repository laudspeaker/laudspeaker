import {
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
import { CustomerDocument } from '../customers/schemas/customer.schema';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { Template } from './entities/template.entity';
import { Job, Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Installation } from '../slack/entities/installation.entity';
import { SlackService } from '../slack/slack.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { EventDto } from '../events/dto/event.dto';
import { Audience } from '../audiences/entities/audience.entity';
import { Liquid } from 'liquidjs';
import twilio from 'twilio';

@Injectable()
export class TemplatesService {
  private tagEngine = new Liquid();

  private MAXIMUM_SMS_LENGTH = 1600;

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    @InjectRepository(Template)
    public templatesRepository: Repository<Template>,
    @InjectRepository(Audience)
    private audiencesRepository: Repository<Audience>,
    @Inject(SlackService) private slackService: SlackService,
    @InjectQueue('email') private readonly emailQueue: Queue,
    @InjectQueue('slack') private readonly slackQueue: Queue
  ) {}

  create(account: Account, createTemplateDto: CreateTemplateDto) {
    const template = new Template();
    template.type = createTemplateDto.type;
    template.name = createTemplateDto.name;
    switch (template.type) {
      case 'email':
        template.subject = createTemplateDto.subject;
        template.text = createTemplateDto.text;
        template.style = createTemplateDto.style;
        break;
      case 'slack':
        template.slackMessage = createTemplateDto.slackMessage;
        break;
      case 'sms':
        template.smsText = createTemplateDto.smsText;
        break;
      //TODO
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

    const {
      mailgunAPIKey,
      sendingName,
      testSendingEmail,
      testSendingName,
      sendgridApiKey,
      sendgridFromEmail,
    } = account;
    let { sendingDomain, sendingEmail } = account;

    let key = mailgunAPIKey;
    let from = sendingName;

    switch (template.type) {
      case 'email':
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

        job = await this.emailQueue.add('send', {
          eventProvider: account.emailProvider,
          key,
          from,
          domain: sendingDomain,
          email: sendingEmail,
          to: customer.phEmail ? customer.phEmail : customer.email,
          audienceId,
          customerId,
          tags,
          subject: template.subject,
          text: template.text,
        });
        if (account.emailProvider === 'free3') await account.save();
        break;
      case 'slack':
        try {
          installation = await this.slackService.getInstallation(customer);
        } catch (err) {
          return Promise.reject(err);
        }
        job = await this.slackQueue.add('send', {
          methodName: 'chat.postMessage',
          token: installation.installation.bot.token,
          args: {
            channel: customer.slackId,
            text: event?.payload ? event.payload : template.slackMessage,
            tags,
          },
        });
        break;
      case 'sms':
        // job = await this.smsQueue.add('send', {
        //   sid: account.smsAccountSid,
        //   token: account.smsAuthToken,
        //   from: account.smsFrom,
        //   to: customer.phPhoneNumber || customer.phone,
        //   tags,
        //   text: template.smsText,
        //   audienceId,
        //   customerId,
        // });
        try {
          if (!customer.phPhoneNumber && !customer.phone) {
            this.logger.warn(
              `Customer ${customer.id} has no phone number; skipping`
            );
            return;
          }
          this.logger.debug(
            `Starting SMS sending from ${account?.smsFrom} to ${
              customer.phPhoneNumber || customer.phone
            }`
          );
          let textWithInsertedTags: string | undefined;

          if (template.smsText) {
            textWithInsertedTags = await this.tagEngine.parseAndRender(
              template.smsText,
              tags || {}
            );
          }

          this.logger.debug(
            `Finished rendering tags in SMS from ${account?.smsFrom} to ${
              customer.phPhoneNumber || customer.phone
            }`
          );
          const twilioClient = twilio(
            account.smsAccountSid,
            account.smsAuthToken
          );

          message = await twilioClient.messages.create({
            body: textWithInsertedTags?.slice(0, this.MAXIMUM_SMS_LENGTH),
            from: account.smsFrom,
            to: customer.phPhoneNumber || customer.phone,
            statusCallback: `${process.env.TWILIO_WEBHOOK_ENDPOINT}?audienceId=${audienceId}&customerId=${customerId}`,
          });

          this.logger.debug(
            `Sms with sid ${message.sid} status: ${JSON.stringify(
              message.status
            )}`
          );
        } catch (e) {
          this.logger.error(e);
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

  findBy(
    account: Account,
    type: 'email' | 'slack' | 'sms'
  ): Promise<Template[]> {
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

    const { owner, slackMessage, style, subject, text, type, smsText } =
      foundTemplate;

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
}
