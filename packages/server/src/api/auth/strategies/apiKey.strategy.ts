import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Account } from '../../accounts/entities/accounts.entity';
import { Workspaces } from '../../workspaces/entities/workspaces.entity';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy) {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private authService: AuthService
  ) {
    super(
      { header: 'Authorization', prefix: 'Api-Key ' },
      true,
      async (apikey, done, req) => {
        let checkKey: { account: Account; workspace: Workspaces };
        try {
          checkKey = await this.cacheManager.get(apikey);
          if (!checkKey) {
            checkKey = await this.authService.validateAPIKey(apikey);
            await this.cacheManager.set(apikey, checkKey);
          }
        } catch (e) {
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
