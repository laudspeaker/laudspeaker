import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Account } from '../../accounts/entities/accounts.entity';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy) {
  constructor(private authService: AuthService) {
    super(
      { header: 'Authorization', prefix: 'Api-Key ' },
      true,
      async (apikey, done, req) => {
        let checkKey: Account;
        try {
          checkKey = await this.authService.validateAPIKey(apikey);
          console.log('\nCHECK KEY', checkKey);
        } catch (e) {
          console.log('\nCHECK KEY ERROR:', checkKey, e);

          return done(e, false);
        }
        if (!checkKey) {
          return done(null, false);
        }
        return done(null, checkKey);
      }
    );
  }
}
