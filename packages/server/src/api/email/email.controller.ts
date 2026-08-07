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
import * as __ from 'async-dash';
import { CustomersService } from '../customers/customers.service';
import { RavenInterceptor } from 'nest-raven';
import { Resend } from 'resend';
import { QueueType } from '../../common/services/queue/types/queue-type';
import { Producer } from '../../common/services/queue/classes/producer';

@Controller('email')
export class EmailController {
  constructor(
    @InjectRepository(Account)
    private usersRepository: Repository<Account>,
    @Inject(CustomersService)
    private readonly customersService: CustomersService
  ) {}

  @UseInterceptors(new RavenInterceptor())
  @Post('send')
  @UseGuards(JwtAuthGuard)
  async send(@Req() { user }: Request, @Body() sendEmailDto: SendEmailDto) {
    const found = <Account>user;

    const workspace = found.teams?.[0]?.organization?.workspaces?.[0];

    await Producer.add(QueueType.MESSAGE, {
      trackingEmail: found.email,
      accountId: found.id,
      key: workspace.mailgunAPIKey,
      from: workspace.sendingName,
      domain: workspace.sendingDomain,
      email: workspace.sendingEmail,
      to: sendEmailDto.to,
      subject: sendEmailDto.subject,
      text: sendEmailDto.text,
    }, 'email');
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
}
