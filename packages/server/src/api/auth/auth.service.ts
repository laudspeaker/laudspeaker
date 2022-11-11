import { HttpException, HttpStatus, Inject, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Account, PlanType } from '../accounts/entities/accounts.entity';
import { Repository } from 'typeorm';
import { RegisterDto } from '@/api/auth/dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { AuthHelper } from './auth.helper';

@Injectable()
export class AuthService {
  @InjectRepository(Account)
  public readonly repository: Repository<Account>;

  @Inject(AuthHelper)
  public readonly helper: AuthHelper;

  public async register(body: RegisterDto): Promise<any | never> {
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

    return { ...ret, access_token: this.helper.generateToken(user) };
  }

  public async login(body: LoginDto): Promise<any | never> {
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
}
