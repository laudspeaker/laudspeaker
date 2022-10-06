import {
  Injectable,
  HttpException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { BaseJwtHelper } from '../../common/helper/base-jwt.helper';

@Injectable()
export class AuthHelper extends BaseJwtHelper {
  @InjectRepository(Account)
  private readonly repository: Repository<Account>;

  private readonly jwt: JwtService;

  constructor(jwt: JwtService) {
    super();
    this.jwt = jwt;
  }

  // Decoding the JWT Token
  public async decode(token: string): Promise<unknown> {
    return this.jwt.decode(token, null);
  }

  // Get User by User ID we get from decode()
  public async validateUser(decoded: any): Promise<Account> {
    return this.repository.findOne({ where: { id: decoded.id } });
  }

  // Generate JWT Token
  public generateToken(user: Account): string {
    return this.jwt.sign({ id: user.id, email: user.email });
  }

  // Validate JWT Token, throw forbidden error if JWT Token is invalid
  private async validate(token: string): Promise<boolean | never> {
    const decoded: unknown = this.jwt.verify(token);

    if (!decoded) {
      throw new HttpException('Forbidden', HttpStatus.FORBIDDEN);
    }

    const user: Account = await this.validateUser(decoded);

    if (!user) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
