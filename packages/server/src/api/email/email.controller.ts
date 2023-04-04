import {
  Controller,
  Get,
  Post,
  Param,
  UseGuards,
  Body,
  Req,
  Inject,
} from '@nestjs/common';
import { Queue } from 'bullmq';
import { InjectQueue } from '@nestjs/bullmq';
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

  @Post('send')
  @UseGuards(JwtAuthGuard)
  async send(@Req() { user }: Request, @Body() sendEmailDto: SendEmailDto) {
    const found: Account = await this.usersRepository.findOneBy({
      id: (<Account>user).id,
    });
    await this.messageQueue.add('email', {
      trackingEmail: found.email,
      accountId: found.id,
      key: found.mailgunAPIKey,
      from: found.sendingName,
      domain: found.sendingDomain,
      email: found.sendingEmail,
      to: sendEmailDto.to,
      subject: sendEmailDto.subject,
      text: sendEmailDto.text,
    });
  }

  @Get('domains/:key')
  @UseGuards(JwtAuthGuard)
  async domains(@Param('key') key: string) {
    const mailgun = new Mailgun(FormData);
    const mg = mailgun.client({ username: 'api', key: key });
    return _.filter(await mg.domains.list(), ['state', 'active']);
  }

  @Post('send/:audienceName')
  @UseGuards(JwtAuthGuard)
  async sendBatch(
    @Req() { user }: Request,
    @Body() sendEmailDto: SendEmailDto,
    @Param('audienceName') name: string
  ) {
    const found: Account = await this.usersRepository.findOneBy({
      id: (<Account>user).id,
    });
    const audienceObj = await this.audienceRepository.findOneBy({
      owner: { id: (<Account>user).id },
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
            key: found.mailgunAPIKey,
            from: found.sendingName,
            domain: found.sendingDomain,
            email: found.sendingEmail,
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
