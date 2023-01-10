import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account, PlanType } from '../accounts/entities/accounts.entity';
import { Repository } from 'typeorm';
import { RegisterDto } from '@/api/auth/dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthHelper } from './auth.helper';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';
import { Verification } from './entities/verification.entity';
import { CustomersService } from '../customers/customers.service';

@Injectable()
export class AuthService {
  constructor(
    @InjectQueue('email') private readonly emailQueue: Queue,
    @InjectRepository(Account)
    public readonly repository: Repository<Account>,
    @InjectRepository(Verification)
    public readonly verificationRepository: Repository<Verification>,
    @Inject(AuthHelper)
    public readonly helper: AuthHelper,
    @Inject(CustomersService) private customersService: CustomersService
  ) {}

  public async register(body: RegisterDto) {
    const { firstName, lastName, email, password }: RegisterDto = body;
    let user: Account = await this.repository.findOne({ where: { email } });
    if (user) {
      throw new HttpException('Conflict', HttpStatus.CONFLICT);
    }

    user = new Account();

    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;
    user.password = this.helper.encodePassword(password);
    user.apiKey = this.helper.generateApiKey();
    const ret = await this.repository.save({
      ...user,
      accountCreatedAt: new Date(),
      plan: PlanType.FREE,
    });
    await this.helper.generateDefaultData(ret.id);

    user.id = ret.id;

    await this.requestVerification(ret);

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

  public async requestVerification(user: Account) {
    let verification = this.verificationRepository.create({
      email: user.email,
      account: { id: user.id },
      status: 'sent',
    });

    verification = await this.verificationRepository.save(verification);

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

    if (customerId) {
      const foundCustomer = await this.customersService.findById(
        account,
        customerId
      );

      foundCustomer.verified = true;
      await foundCustomer.save();
    } else {
      const customer = await this.customersService.create(account, {
        email,
        firstName,
        lastName,
        verified,
      });
      account.customerId = customer.id;
    }

    await account.save();
    await verification.save();
  }
}
