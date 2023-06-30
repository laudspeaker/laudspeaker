import {
  HttpException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account, PlanType } from '../accounts/entities/accounts.entity';
import { DataSource, EntityManager, QueryRunner, Repository } from 'typeorm';
import { RegisterDto } from '../auth/dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthHelper } from './auth.helper';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Verification } from './entities/verification.entity';
import { CustomersService } from '../customers/customers.service';
import mongoose from 'mongoose';
import { InjectConnection } from '@nestjs/mongoose';
import { RequestResetPasswordDto } from './dto/request-reset-password.dto';
import { Recovery } from './entities/recovery.entity';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';

@Injectable()
export class AuthService {
  constructor(
    private dataSource: DataSource,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @InjectQueue('message') private readonly messageQueue: Queue,
    @InjectRepository(Account)
    public readonly accountRepository: Repository<Account>,
    @InjectRepository(Verification)
    public readonly verificationRepository: Repository<Verification>,
    @InjectRepository(Recovery)
    public readonly recoveryRepository: Repository<Recovery>,
    @Inject(AuthHelper)
    public readonly helper: AuthHelper,
    @Inject(CustomersService) private customersService: CustomersService,
    @InjectConnection() private readonly connection: mongoose.Connection
  ) {}

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: AuthService.name,
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
        class: AuthService.name,
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
        class: AuthService.name,
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
        class: AuthService.name,
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
        class: AuthService.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  public async register(body: RegisterDto, session: string) {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();
    let err;
    try {
      const { firstName, lastName, email, password }: RegisterDto = body;
      let user: Account = await queryRunner.manager.findOne(Account, {
        where: { email },
      });
      if (user) {
        throw new HttpException(
          'This account already exists',
          HttpStatus.CONFLICT
        );
      }

      user = new Account();

      user.firstName = firstName;
      user.lastName = lastName;
      user.email = email;
      user.password = this.helper.encodePassword(password);
      user.apiKey = this.helper.generateApiKey();
      user.accountCreatedAt = new Date();
      user.plan = PlanType.FREE;
      let ret = await queryRunner.manager.save(user);
      await this.helper.generateDefaultData(ret, queryRunner, session);

      user.id = ret.id;

      await this.requestVerification(ret, queryRunner, session);
      await queryRunner.commitTransaction();
      return { ...ret, access_token: this.helper.generateToken(ret) };
    } catch (e) {
      err = e;
      this.error(e, this.register.name, session);
      await queryRunner.rollbackTransaction();
    } finally {
      await queryRunner.release();
      if (err) throw err;
    }
  }

  public async login(body: LoginDto, session: string) {
    const { email, password }: LoginDto = body;
    const user: Account = await this.accountRepository.findOne({
      where: { email },
    });

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

    const ret = await this.accountRepository.save({
      ...user,
      lastLoginAt: new Date(),
    });

    return { ...ret, access_token: this.helper.generateToken(user) };
  }

  public async validateAPIKey(apiKey: string): Promise<Account | never> {
    const user: Account = await this.accountRepository.findOne({
      where: { apiKey: apiKey },
    });
    return user;
  }

  public async refresh(user: Account, session: string): Promise<string> {
    this.accountRepository.update(user.id, { lastLoginAt: new Date() });

    return this.helper.generateToken(user);
  }

  public async requestVerification(
    user: Account,
    queryRunner: QueryRunner,
    session: string
  ) {
    let verification = new Verification();
    verification.email = user.email;
    verification.account = user;
    verification.status = 'sent';

    verification = await queryRunner.manager.save(verification);

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${verification.id}`;

    await this.messageQueue.add('email', {
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

  public async verifyEmail(
    user: Account,
    verificationId: string,
    session: string
  ) {
    const account = await this.accountRepository.findOneBy({ id: user.id });
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
          session,
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

  public async requestResetPassword(
    { email }: RequestResetPasswordDto,
    session: string
  ) {
    const account = await this.accountRepository.findOneBy({ email });

    if (!account)
      throw new NotFoundException('There is no account with this email');

    await this.dataSource.transaction(async (transactionSession) => {
      const recovery = await transactionSession.save(Recovery, { account });
      const recoveryLink = `${process.env.FRONTEND_URL}/reset-password/${recovery.id}`;

      await this.messageQueue.add('email', {
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

  public async resetPassword(
    { password }: ResetPasswordDto,
    id: string,
    session: string
  ) {
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
