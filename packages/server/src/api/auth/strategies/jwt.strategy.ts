import { Injectable, Inject } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthHelper } from '../auth.helper';
import { Account } from '../../accounts/entities/accounts.entity';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { LoggerService } from '@nestjs/common/services';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  @Inject(WINSTON_MODULE_NEST_PROVIDER)
  private readonly logger: LoggerService;
  @Inject(AuthHelper)
  private readonly helper: AuthHelper;

  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_KEY,
      ignoreExpiration: false,
    });
  }

  private validate(payload: { id: string }): Promise<Account | never> {
    this.logger.debug(`jwt.strategy.ts:JwtStrategy.validate:Validating user with id ${payload.id}`);
    return this.helper.validateUser(payload);
  }
}
