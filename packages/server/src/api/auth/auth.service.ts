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
import { Workspaces } from '../workspaces/entities/workspaces.entity';
import { OrganizationInvites } from '../organizations/entities/organization-invites.entity';
import { OrganizationTeam } from '../organizations/entities/organization-team.entity';

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
    @InjectRepository(Workspaces)
    public readonly workspacesRepository: Repository<Workspaces>,
    @InjectRepository(OrganizationTeam)
    public organizationTeamRepository: Repository<OrganizationTeam>,
    @Inject(AuthHelper)
    public readonly helper: AuthHelper,
    @Inject(CustomersService) private customersService: CustomersService,
    @InjectConnection() private readonly connection: mongoose.Connection,
    @InjectRepository(OrganizationInvites)
    public organizationInvitesRepository: Repository<OrganizationInvites>
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
    let invite: OrganizationInvites;
    if (body.fromInviteId) {
      invite = await this.organizationInvitesRepository.findOne({
        where: { id: body.fromInviteId },
        relations: ['team'],
      });
      if (!invite) {
        throw new HttpException("Couldn't find", HttpStatus.FORBIDDEN);
      }
    }
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
      user.accountCreatedAt = new Date();
      if (process.env.EMAIL_VERIFICATION !== 'true') {
        user.verified = true;
      }

      const ret = await queryRunner.manager.save(user);

      user.id = ret.id;

      if (process.env.EMAIL_VERIFICATION === 'true') {
        await this.requestVerification(ret, queryRunner, session);
      }
      if (body.fromInviteId && invite) {
        const team = await this.organizationTeamRepository.findOne({
          where: { id: invite.team.id },
          relations: ['members'],
        });
        team.members.push(user);
        await queryRunner.manager.save(OrganizationTeam, team);
        await queryRunner.manager.remove(OrganizationInvites, invite);
      }
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

  // For now return account from workspaces owner perspective
  public async validateAPIKey(
    apiKey: string
  ): Promise<{ account: Account; workspace: Workspaces } | never> {
    const workspace = await this.workspacesRepository.findOne({
      where: {
        apiKey,
      },
      relations: ['organization.owner'],
    });
    const account = await this.accountRepository.findOne({
      where: { id: workspace.organization.owner.id },
      relations: ['teams.organization.workspaces', 'teams.organization.owner'],
    });

    return { account: account, workspace: workspace };
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

    if (queryRunner)
      verification = await queryRunner.manager.save(verification);
    else verification = await this.verificationRepository.save(verification);

    const verificationLink = `${process.env.FRONTEND_URL}/verify-email/${verification.id}`;

    if (process.env.EMAIL_VERIFICATION_PROVIDER === 'gmail') {
      await this.messageQueue.add('email', {
        eventProvider: 'gmail',
        key: process.env.GMAIL_APP_CRED,
        from: 'Laudspeaker',
        email: process.env.GMAIL_VERIFICATION_EMAIL,
        to: user.email,
        subject: 'Email verification',
        plainText:
          'Paste the following link into your browser:' + verificationLink,
        text: `Paste the following link into your browser: <a href="${verificationLink}">${verificationLink}</a>`,
      });
    } else if (process.env.EMAIL_VERIFICATION_PROVIDER === 'mailgun') {
      await this.messageQueue.add('email', {
        key: process.env.MAILGUN_API_KEY,
        from: 'Laudspeaker',
        domain: process.env.MAILGUN_DOMAIN,
        email: 'noreply',
        to: user.email,
        subject: 'Email verification',
        text: `Link: <a href="${verificationLink}">${verificationLink}</a>`,
      });
    } else {
      //default is mailgun right now
      await this.messageQueue.add('email', {
        key: process.env.MAILGUN_API_KEY,
        from: 'Laudspeaker',
        domain: process.env.MAILGUN_DOMAIN,
        email: 'noreply',
        to: user.email,
        subject: 'Email verification',
        text: `Link: <a href="${verificationLink}">${verificationLink}</a>`,
      });
    }
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

    const { email, firstName, lastName, verified } = account;

    const transactionSession = await this.connection.startSession();
    transactionSession.startTransaction();

    try {
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

      //to do
      switch (process.env.EMAIL_VERIFICATION_PROVIDER) {
        case 'gmail':
          //console.log("sending gmail email resend");
          await this.messageQueue.add('email', {
            eventProvider: 'gmail',
            key: process.env.GMAIL_APP_CRED,
            from: 'Laudspeaker',
            email: process.env.GMAIL_VERIFICATION_EMAIL,
            to: account.email,
            subject: 'Password recovery',
            plaintext: `Recovery link: "${recoveryLink}"`,
            text: `Recovery link: <a href="${recoveryLink}">${recoveryLink}</a>`,
          });
          break;
        default:
          await this.messageQueue.add('email', {
            key: process.env.MAILGUN_API_KEY,
            from: 'Laudspeaker',
            domain: process.env.MAILGUN_DOMAIN,
            email: 'noreply',
            to: account.email,
            subject: 'Password recovery',
            text: `Recovery link: <a href="${recoveryLink}">${recoveryLink}</a>`,
          });
          break;
      }
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
