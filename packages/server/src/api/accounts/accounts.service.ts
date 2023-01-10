import { BaseJwtHelper } from '../../common/helper/base-jwt.helper';
import {
  BadRequestException,
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UpdateAccountDto } from './dto/update-account.dto';
import { Account } from './entities/accounts.entity';
import * as bcrypt from 'bcryptjs';
import { CustomersService } from '../customers/customers.service';
import { AuthService } from '../auth/auth.service';
import { MailService } from '@sendgrid/mail';
import { Client } from '@sendgrid/client';
import { RemoveAccountDto } from './dto/remove-account.dto';

@Injectable()
export class AccountsService extends BaseJwtHelper {
  private sgMailService = new MailService();
  private sgClient = new Client();

  constructor(
    @InjectRepository(Account)
    public accountsRepository: Repository<Account>,
    @Inject(CustomersService) private customersService: CustomersService,
    @Inject(AuthService) private authService: AuthService
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
            group_resubscribe: false,
            delivered: true,
            group_unsubscribe: false,
            spam_report: false,
            bounce: false,
            deferred: false,
            unsubscribe: false,
            processed: false,
            open: true,
            click: true,
            dropped: false,
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
        await customer.save();
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

    const updatedUser = await this.accountsRepository.save({
      ...oldUser,
      ...updateUserDto,
      password,
      verified,
      sendgridVerificationKey: verificationKey,
    });

    if (needEmailUpdate)
      await this.authService.requestVerification(updatedUser);

    return updatedUser;
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

    await this.customersService.CustomerModel.deleteMany({
      ownerId: account.id,
    }).exec();
    await this.accountsRepository.delete(account.id);
  }
}
