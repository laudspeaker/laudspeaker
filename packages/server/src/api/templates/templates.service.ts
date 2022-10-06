import { Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { CustomersService } from '../customers/customers.service';
import { CustomerDocument } from '../customers/schemas/customer.schema';
import { CreateTemplateDto } from './dto/create-template.dto';
import { UpdateTemplateDto } from './dto/update-template.dto';
import { Template } from './entities/template.entity';
import { Job, Queue } from 'bull';
import { InjectQueue } from '@nestjs/bull';
import { Installation } from '../slack/entities/installation.entity';
import { SlackService } from '../slack/slack.service';

@Injectable()
export class TemplatesService {
  constructor(
    @InjectRepository(Template)
    private templatesRepository: Repository<Template>,
    @Inject(CustomersService) private customersService: CustomersService,
    @Inject(SlackService) private slackService: SlackService,
    @InjectQueue('email') private readonly emailQueue: Queue,
    @InjectQueue('slack') private readonly slackQueue: Queue
  ) {}

  create(account: Account, createTemplateDto: CreateTemplateDto) {
    const template = new Template();
    template.type = createTemplateDto.type;
    template.name = createTemplateDto.name;
    template.ownerId = (<Account>account).id;
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
        break;
      //TODO
    }
    return this.templatesRepository.save(template);
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
    customerId: string
  ): Promise<Job<any>> {
    let customer: CustomerDocument,
      template: Template,
      jobId: Job<any>, // created jobId
      installation: Installation;
    try {
      customer = await this.customersService.findById(account, customerId);
    } catch (err) {
      return Promise.reject(err);
    }
    try {
      template = await this.findOneById(account, templateId);
    } catch (err) {
      return Promise.reject(err);
    }
    switch (template.type) {
      case 'email':
        jobId = await this.emailQueue.add('send', {
          key: account.mailgunAPIKey,
          from: account.sendingName,
          domain: account.sendingDomain,
          email: account.sendingEmail,
          to: customer.email,
          subject: template.subject,
          text: template.text,
        });
        break;
      case 'slack':
        try {
          installation = await this.slackService.getInstallation(customer);
        } catch (err) {
          return Promise.reject(err);
        }
        jobId = await this.slackQueue.add('send', {
          methodName: 'chat.postMessage',
          token: installation.installation.bot.token,
          args: {
            channel: customer.slackId,
            text: template.slackMessage,
          },
        });
        break;
      case 'sms':
        break;
    }
    return Promise.resolve(jobId);
  }

  findAll(account: Account): Promise<Template[]> {
    return this.templatesRepository.findBy({ ownerId: (<Account>account).id });
  }

  findOne(account: Account, name: string): Promise<Template> {
    return this.templatesRepository.findOneBy({
      ownerId: (<Account>account).id,
      name: name,
    });
  }

  findOneById(account: Account, id: string): Promise<Template> {
    return this.templatesRepository.findOneBy({
      ownerId: (<Account>account).id,
      id: id,
    });
  }

  findBy(
    account: Account,
    type: 'email' | 'slack' | 'sms'
  ): Promise<Template[]> {
    return this.templatesRepository.findBy({
      ownerId: (<Account>account).id,
      type: type,
    });
  }

  update(account: Account, name: string, updateTemplateDto: UpdateTemplateDto) {
    return this.templatesRepository.update(
      { ownerId: (<Account>account).id, name: name },
      { ...updateTemplateDto }
    );
  }

  async remove(account: Account, name: string): Promise<void> {
    await this.templatesRepository.delete({
      ownerId: (<Account>account).id,
      name,
    });
  }
}
