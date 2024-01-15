import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Body,
  Req,
  Inject,
  UseInterceptors,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import Mailgun from 'mailgun.js';
import FormData from 'form-data';
import * as _ from 'lodash';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SendEmailDto } from './dto/send-email.dto';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { Request } from 'express';
import { Audience } from '../audiences/entities/audience.entity';
import * as __ from 'async-dash';
import { CustomersService } from '../customers/customers.service';
import { RavenInterceptor } from 'nest-raven';
import { Resend } from 'resend';

@Controller('email')
export class EmailController {
  constructor(
    @InjectQueue('message') private readonly messageQueue: Queue,
    @InjectRepository(Account)
    private usersRepository: Repository<Account>,
    @InjectRepository(Audience)
    private audienceRepository: Repository<Audience>,
    @Inject(CustomersService)
    private readonly customersService: CustomersService
  ) {}

  @UseInterceptors(new RavenInterceptor())
  @Post('send')
  @UseGuards(JwtAuthGuard)
  async send(@Req() { user }: Request, @Body() sendEmailDto: SendEmailDto) {
    const found = <Account>user;

    const workspace = found.teams?.[0]?.organization?.workspaces?.[0];

    await this.messageQueue.add('email', {
      trackingEmail: found.email,
      accountId: found.id,
      key: workspace.mailgunAPIKey,
      from: workspace.sendingName,
      domain: workspace.sendingDomain,
      email: workspace.sendingEmail,
      to: sendEmailDto.to,
      subject: sendEmailDto.subject,
      text: sendEmailDto.text,
    });
  }

  @UseInterceptors(new RavenInterceptor())
  @Get('domains/:key')
  @UseGuards(JwtAuthGuard)
  async domains(@Param('key') key: string) {
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({ username: 'api', key: key });
    return _.filter(await mg.domains.list(), ['state', 'active']);
  }

  @UseInterceptors(new RavenInterceptor())
  @Get('resend/domains/:key')
  @UseGuards(JwtAuthGuard)
  async resendDomains(@Param('key') key: string) {
    const resend = new Resend(key);
    const response: any = await resend.domains.list();
    const domains = response['data']['data'];
    const verified = _.filter(domains, ['status', 'verified']);
    return verified;
  }

  @UseInterceptors(new RavenInterceptor())
  @Post('send/:audienceName')
  @UseGuards(JwtAuthGuard)
  async sendBatch(
    @Req() { user }: Request,
    @Body() sendEmailDto: SendEmailDto,
    @Param('audienceName') name: string
  ) {
    const found = <Account>user;
    const workspace = found?.teams?.[0]?.organization?.workspaces?.[0];
    const audienceObj = await this.audienceRepository.findOneBy({
      owner: { id: found.id },
      name: name,
    });
    const jobs = await Promise.all(
      audienceObj.customers.map(async (customerId) => {
        const { email } = (
          await this.customersService.findById(found, customerId)
        ).toObject();

        return {
          name: 'email',
          data: {
            accountId: found.id,
            key: workspace.mailgunAPIKey,
            from: workspace.sendingName,
            domain: workspace.sendingDomain,
            email: workspace.sendingEmail,
            to: email,
            subject: sendEmailDto.subject,
            text: sendEmailDto.text,
          },
        };
      })
    );
    await this.messageQueue.addBulk(jobs);
  }
}
