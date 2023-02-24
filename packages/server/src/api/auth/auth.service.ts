import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account, PlanType } from '../accounts/entities/accounts.entity';
import { DataSource, EntityManager, Repository } from 'typeorm';
import { RegisterDto } from '@/api/auth/dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthHelper } from './auth.helper';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Verification } from './entities/verification.entity';
import { CustomersService } from '../customers/customers.service';
import mongoose from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { RequestResetPasswordDto } from './dto/request-reset-password.dto';
import { Recovery } from './entities/recovery.entity';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private dataSource: DataSource,
    @InjectQueue('email') private readonly emailQueue: Queue,
    @InjectRepository(Account)
    public readonly repository: Repository<Account>,
    @InjectRepository(Verification)
    public readonly verificationRepository: Repository<Verification>,
    @InjectRepository(Recovery)
    public readonly recoveryRepository: Repository<Recovery>,
    @Inject(AuthHelper)
    public readonly helper: AuthHelper,
    @Inject(CustomersService) private customersService: CustomersService,
    @InjectConnection() private readonly connection: mongoose.Connection
  ) {}

  public async register(body: RegisterDto) {
    const { firstName, lastName, email, password }: RegisterDto = body;
    let user: Account = await this.repository.findOne({ where: { email } });
    if (user) {
      throw new HttpException(
        'This account already exists',
        HttpStatus.CONFLICT
      );
    }

    let ret: Account;
    await this.dataSource.manager.transaction(async (transactionManager) => {
      user = new Account();

      user.firstName = firstName;
      user.lastName = lastName;
      user.email = email;
      user.password = this.helper.encodePassword(password);
      user.apiKey = this.helper.generateApiKey();
      user.accountCreatedAt = new Date();
      user.plan = PlanType.FREE;
      ret = await transactionManager.save(user);
      await this.helper.generateDefaultData(ret, transactionManager);

      user.id = ret.id;

      await this.requestVerification(ret, transactionManager);
    });

    return { ...ret, access_token: this.helper.generateToken(ret) };
  }

  public async login(body: LoginDto) {
    const { email, password }: LoginDto = body;
    const user: Account = await this.repository.findOne({ where: { email } });

    if (!user) {
      throw new HttpException('No user found', HttpStatus.NOT_FOUND);
    }

    const isPasswordValid: boolean = this.helper.isPasswordValid(
      password,
      user.password
    );

    if (!isPasswordValid) {
      throw new HttpException('No user found', HttpStatus.NOT_FOUND);
    }

    const ret = await this.repository.save({
      ...user,
      lastLoginAt: new Date(),
    });

    return { ...ret, access_token: this.helper.generateToken(user) };
  }

  public async validateAPIKey(apiKey: string): Promise<Account | never> {
    const user: Account = await this.repository.findOne({
      where: { apiKey: apiKey },
    });
    return user;
  }

  public async refresh(user: Account): Promise<string> {
    this.repository.update(user.id, { lastLoginAt: new Date() });

    return this.helper.generateToken(user);
  }

  public async requestVerification(
    user: Account,
    transactionManager: EntityManager = this.dataSource.manager
  ) {
    let verification = new Verification();
    verification.email = user.email;
    verification.account = user;
    verification.status = 'sent';

    verification = await transactionManager.save(verification);

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${verification.id}`;

    await this.emailQueue.add('send', {
      key: process.env.MAILGUN_API_KEY,
      from: 'Laudspeaker',
      domain: process.env.MAILGUN_DOMAIN,
      email: 'noreply',
      to: user.email,
      subject: 'Email verification',
      text: `Link: <a href="${verificationLink}">${verificationLink}</a>`,
    });

    return verification;
  }

  public async verifyEmail(user: Account, verificationId: string) {
    const account = await this.repository.findOneBy({ id: user.id });
    if (!account)
      throw new HttpException('User not found', HttpStatus.NOT_FOUND);

    const verification = await this.verificationRepository.findOneBy({
      id: verificationId,
      account: { id: user.id },
      status: 'sent',
    });
    if (!verification)
      throw new HttpException('Verification not found', HttpStatus.NOT_FOUND);

    if (verification.email !== account.email)
      throw new HttpException('Unexpected user email', HttpStatus.BAD_REQUEST);

    account.verified = true;
    verification.status = 'verified';

    const { email, firstName, lastName, verified, customerId } = account;

    const transactionSession = await this.connection.startSession();
    transactionSession.startTransaction();

    try {
      if (customerId) {
        const foundCustomer = await this.customersService.findById(
          account,
          customerId
        );

        foundCustomer.verified = true;
        await foundCustomer.save({ session: transactionSession });
      } else {
        const customer = await this.customersService.create(
          account,
          {
            email,
            firstName,
            lastName,
            verified,
          },
          transactionSession
        );
        account.customerId = customer.id;
      }

      await this.dataSource.transaction(async (transactionSession) => {
        await transactionSession.save(account);
        await transactionSession.save(verification);
      });
      await transactionSession.commitTransaction();
    } catch (e) {
      await transactionSession.abortTransaction();
    } finally {
      await transactionSession.endSession();
    }
  }

  public async requestResetPassword({ email }: RequestResetPasswordDto) {
    const account = await this.repository.findOneBy({ email });

    if (!account)
      throw new NotFoundException('There is no account with this email');

    await this.dataSource.transaction(async (transactionSession) => {
      const recovery = await transactionSession.save(Recovery, { account });
      const recoveryLink = `${process.env.FRONTEND_URL}/reset-password/${recovery.id}`;

      await this.emailQueue.add('send', {
        key: process.env.MAILGUN_API_KEY,
        from: 'Laudspeaker',
        domain: process.env.MAILGUN_DOMAIN,
        email: 'noreply',
        to: account.email,
        subject: 'Password recovery',
        text: `Recovery link: <a href="${recoveryLink}">${recoveryLink}</a>`,
      });
    });
  }

  public async resetPassword({ password }: ResetPasswordDto, id: string) {
    const recovery = await this.recoveryRepository.findOne({
      where: { id },
      relations: ['account'],
    });

    if (!recovery?.account) throw new NotFoundException('Recover id not found');

    await this.dataSource.transaction(async (transactionSession) => {
      await transactionSession.save(Account, {
        id: recovery.account.id,
        password: this.helper.encodePassword(password),
      });

      await transactionSession.delete(Recovery, { id: recovery.id });
    });
  }
}
