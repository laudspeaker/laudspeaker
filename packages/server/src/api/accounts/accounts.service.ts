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
import mongoose, { ClientSession } from 'mongoose';
import { WebhooksService } from '../webhooks/webhooks.service';
import * as admin from 'firebase-admin';
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

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: AccountsService.name,
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
        class: AccountsService.name,
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
        class: AccountsService.name,
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
        class: AccountsService.name,
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
        class: AccountsService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  findAll(): Promise<Account[]> {
    return this.accountsRepository.find();
  }

  async findOne(
    user: Express.User | { id: string },
    session: string
  ): Promise<Account> {
    try {
      const account = await this.accountsRepository.findOneBy({
        id: (<Account>user).id,
      });

      if (!account) {
        const e = new NotFoundException('Account not found');
        throw e;
      }

      this.debug(
        `Found ${JSON.stringify(account)}`,
        this.findOne.name,
        session,
        (<Account>user).id
      );
      return account;
    } catch (e) {
      this.error(e, this.findOne.name, session, (<Account>user).id);
      throw e;
    }
  }

  findOneByAPIKey(apiKey: string): Promise<Account> {
    return this.accountsRepository.findOneBy({ apiKey: apiKey });
  }

  async update(
    user: Express.User,
    updateUserDto: UpdateAccountDto,
    session: string
  ): Promise<Account> {
    const oldUser = await this.findOne(user, session);
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
        const app = admin.app(oldUser.id);
        if (app) app.delete();
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

    const queryRunner = await this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let err;
    try {
      let updatedUser: Account;
      for (const key of Object.keys(updateUserDto)) {
        oldUser[key] = updateUserDto[key];
      }

      oldUser.password = password;
      oldUser.verified = verified;
      oldUser.sendgridVerificationKey =
        verificationKey || oldUser.sendgridVerificationKey;

      updatedUser = await queryRunner.manager.save(oldUser);

      if (needEmailUpdate)
        await this.authService.requestVerification(
          updatedUser,
          queryRunner,
          session
        );

      await transactionSession.commitTransaction();

      return updatedUser;
    } catch (e) {
      await transactionSession.abortTransaction();
      err = e;
      this.error(e, this.update.name, session);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
      await transactionSession.endSession();
      if (err) throw err;
    }
  }

  async updateApiKey(user: Express.User, session: string): Promise<string> {
    try {
      const newKey = this.generateApiKey();
      this.debug(
        `Generated API Key ${JSON.stringify({ apiKey: newKey })}`,
        this.updateApiKey.name,
        session,
        (<Account>user).id
      );
      const oldUser = await this.findOne(user, session);
      this.debug(
        `Found user: ${JSON.stringify({ id: oldUser.id })}`,
        this.updateApiKey.name,
        session,
        (<Account>user).id
      );
      await this.accountsRepository.save({
        ...oldUser,
        apiKey: newKey,
      });
      this.debug(
        `Updated User's API Key ${JSON.stringify({
          apiKey: newKey,
          id: oldUser.id,
        })}`,
        this.updateApiKey.name,
        session,
        (<Account>user).id
      );
      return newKey;
    } catch (e) {
      this.error(e, this.updateApiKey.name, session, (<Account>user).id);
      throw e;
    }
  }

  async remove(
    user: Express.User,
    removeAccountDto: RemoveAccountDto,
    session: string
  ): Promise<void> {
    let transactionSession: ClientSession;
    try {
      const account = await this.findOne(user, session);
      this.debug(
        `Found ${JSON.stringify({ id: account.id })}`,
        this.remove.name,
        session,
        (<Account>user).id
      );

      if (!bcrypt.compareSync(removeAccountDto.password, account.password))
        throw new BadRequestException('Password is incorrect');

      transactionSession = await this.connection.startSession();
      transactionSession.startTransaction();

      await this.customersService.CustomerModel.deleteMany(
        {
          ownerId: account.id,
        },
        { session: transactionSession }
      )
        .session(transactionSession)
        .exec();
      this.debug(
        `Deleted customers for ${JSON.stringify({ id: account.id })}`,
        this.remove.name,
        session,
        (<Account>user).id
      );

      await this.customersService.CustomerKeysModel.deleteMany(
        {
          ownerId: account.id,
        },
        { session: transactionSession }
      )
        .session(transactionSession)
        .exec();
      this.debug(
        `Deleted customer keys for ${JSON.stringify({ id: account.id })}`,
        this.remove.name,
        session,
        (<Account>user).id
      );

      await this.accountsRepository.delete(account.id);
      this.debug(
        `Deleted ${JSON.stringify({ id: account.id })}`,
        this.remove.name,
        session,
        (<Account>user).id
      );

      await transactionSession.commitTransaction();
    } catch (e) {
      await transactionSession.abortTransaction();
      this.error(e, this.remove.name, session, (<Account>user).id);
      throw e;
    } finally {
      await transactionSession.endSession();
    }
  }
}
