import { BaseJwtHelper } from '../../common/helper/base-jwt.helper';
import {
  BadRequestException,
  forwardRef,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  LoggerService,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Account } from './entities/accounts.entity';
import * as bcrypt from 'bcryptjs';
import { CustomersService } from '../customers/customers.service';
import { AuthService } from '../auth/auth.service';
import { MailService } from '@sendgrid/mail';
import { Client } from '@sendgrid/client';
import { RemoveAccountDto } from './dto/remove-account.dto';
import { InjectConnection } from '@nestjs/mongoose';
import mongoose from 'mongoose';
import { WebhooksService } from '../webhooks/webhooks.service';
import { deleteApp, getApp } from 'firebase-admin/app';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class AccountsService extends BaseJwtHelper {
  private sgMailService = new MailService();
  private sgClient = new Client();

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: LoggerService,
    private dataSource: DataSource,
    @InjectRepository(Account)
    public accountsRepository: Repository<Account>,
    @Inject(forwardRef(() => CustomersService))
    private customersService: CustomersService,
    @Inject(forwardRef(() => AuthService)) private authService: AuthService,
    @InjectConnection() private readonly connection: mongoose.Connection,
    private webhookService: WebhooksService
  ) {
    super();
  }

  findAll(): Promise<Account[]> {
    return this.accountsRepository.find();
  }

  async findOne(user: Express.User | { id: string }): Promise<Account> {
    const account = await this.accountsRepository.findOneBy({
      id: (<Account>user).id,
    });

    if (!account) throw new NotFoundException('Account not found');

    return account;
  }

  findOneByAPIKey(apiKey: string): Promise<Account> {
    return this.accountsRepository.findOneBy({ apiKey: apiKey });
  }

  async update(
    user: Express.User,
    updateUserDto: UpdateAccountDto
  ): Promise<Account> {
    const oldUser = await this.findOne(user);
    // if user change password
    let password = oldUser.password;

    let verificationKey = '';

    if (updateUserDto.emailProvider === 'mailgun') {
      try {
        await this.webhookService.setupMailgunWebhook(
          updateUserDto.mailgunAPIKey,
          updateUserDto.sendingDomain
        );
      } catch (e) {
        this.logger.error(e);
        throw new BadRequestException(
          'There is something wrong with your mailgun'
        );
      }
    }

    if (
      updateUserDto.sendgridFromEmail &&
      updateUserDto.sendgridApiKey &&
      (oldUser.sendgridFromEmail !== updateUserDto.sendgridFromEmail ||
        oldUser.sendgridApiKey !== updateUserDto.sendgridApiKey)
    ) {
      try {
        this.sgMailService.setApiKey(updateUserDto.sendgridApiKey);
        await this.sgMailService.send({
          subject: 'Sendgrid connection to Laudspeaker',
          from: updateUserDto.sendgridFromEmail,
          to: oldUser.email,
          html: '<h1>If you see this message, you successfully connected your sendgrid email to laudspeaker</h1>',
        });

        this.sgClient.setApiKey(updateUserDto.sendgridApiKey);
        await this.sgClient.request({
          url: '/v3/user/webhooks/event/settings',
          method: 'PATCH',
          body: {
            enabled: true,
            url: process.env.SENDGRID_WEBHOOK_ENDPOINT,
            group_resubscribe: true,
            delivered: true,
            group_unsubscribe: true,
            spam_report: true,
            bounce: true,
            deferred: true,
            unsubscribe: true,
            processed: true,
            open: true,
            click: true,
            dropped: true,
          },
        });
        const [_, body] = await this.sgClient.request({
          url: `/v3/user/webhooks/event/settings/signed`,
          method: 'PATCH',
          body: {
            enabled: true,
          },
        });
        verificationKey = body.public_key;
      } catch (e) {
        throw new BadRequestException(
          'There is something wrong with your sendgrid account. Check if your email is verified'
        );
      }
    }

    if (updateUserDto.newPassword) {
      const isPasswordValid: boolean = bcrypt.compareSync(
        updateUserDto.currentPassword,
        password
      );

      if (!isPasswordValid) {
        throw new HttpException(
          'Invalid current password',
          HttpStatus.BAD_REQUEST
        );
      }

      if (updateUserDto.newPassword !== updateUserDto.verifyNewPassword)
        throw new HttpException("Passwords don't match", 400);

      password = this.encodePassword(updateUserDto.newPassword);
      delete updateUserDto.currentPassword;
      delete updateUserDto.newPassword;
      delete updateUserDto.verifyNewPassword;
    }

    if (updateUserDto.expectedOnboarding) {
      oldUser.currentOnboarding = [];
    }

    if (
      updateUserDto.finishedOnboarding &&
      !oldUser.currentOnboarding.includes(updateUserDto.finishedOnboarding) &&
      oldUser.expectedOnboarding.includes(updateUserDto.finishedOnboarding)
    ) {
      oldUser.currentOnboarding.push(updateUserDto.finishedOnboarding);
      delete updateUserDto.finishedOnboarding;
      updateUserDto.onboarded =
        oldUser.expectedOnboarding.length === oldUser.currentOnboarding.length;
    }

    const transactionSession = await this.connection.startSession();
    transactionSession.startTransaction();

    let verified = oldUser.verified;
    const needEmailUpdate =
      updateUserDto.email && oldUser.email !== updateUserDto.email;
    if (needEmailUpdate) {
      verified = false;

      if (oldUser.customerId) {
        const customer = await this.customersService.findById(
          oldUser,
          oldUser.customerId
        );

        customer.verified = false;
        await customer.save({ session: transactionSession });
      }
    }

    if (updateUserDto.firebaseCredentials) {
      try {
        const app = getApp(oldUser.id);
        if (app) deleteApp(app);
      } catch (e) {
        // do nothing
      }
    }

    if (updateUserDto.emailProvider === 'free3' && !verified)
      throw new HttpException(
        'Email has to be verified to use this',
        HttpStatus.BAD_REQUEST
      );

    const { smsAccountSid, smsAuthToken, smsFrom } = updateUserDto;

    const smsDetails = [smsAccountSid, smsAuthToken, smsFrom];

    if (smsDetails.some((item) => !!item) && smsDetails.some((item) => !item))
      throw new HttpException(
        'Both sms account sid, sms auth token and sms from number must be provided',
        HttpStatus.BAD_REQUEST
      );

    try {
      let updatedUser: Account;
      await this.dataSource.manager.transaction(async (transactionManager) => {
        for (const key of Object.keys(updateUserDto)) {
          oldUser[key] = updateUserDto[key];
        }

        oldUser.password = password;
        oldUser.verified = verified;
        oldUser.sendgridVerificationKey =
          verificationKey || oldUser.sendgridVerificationKey;

        updatedUser = await transactionManager.save<Account>(oldUser);

        if (needEmailUpdate)
          await this.authService.requestVerification(
            updatedUser,
            transactionManager
          );
      });

      await transactionSession.commitTransaction();

      return updatedUser;
    } catch (e) {
      await transactionSession.abortTransaction();
      throw e;
    } finally {
      await transactionSession.endSession();
    }
  }

  async updateApiKey(user: Express.User): Promise<string> {
    const newKey = this.generateApiKey();
    const oldUser = await this.findOne(user);

    await this.accountsRepository.save({
      ...oldUser,
      apiKey: newKey,
    });

    return newKey;
  }

  async remove(
    user: Express.User,
    removeAccountDto: RemoveAccountDto
  ): Promise<void> {
    const account = await this.findOne(user);

    if (!bcrypt.compareSync(removeAccountDto.password, account.password))
      throw new BadRequestException('Password is incorrect');

    const transactionSession = await this.connection.startSession();
    transactionSession.startTransaction();

    await this.customersService.CustomerModel.deleteMany(
      {
        ownerId: account.id,
      },
      { session: transactionSession }
    )
      .session(transactionSession)
      .exec();

    await this.customersService.CustomerKeysModel.deleteMany(
      {
        ownerId: account.id,
      },
      { session: transactionSession }
    )
      .session(transactionSession)
      .exec();

    try {
      await this.accountsRepository.delete(account.id);
      await transactionSession.commitTransaction();
    } catch (e) {
      await transactionSession.abortTransaction();
      throw e;
    } finally {
      await transactionSession.endSession();
    }
  }
}
