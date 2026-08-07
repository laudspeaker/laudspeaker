import { HeaderAPIKeyStrategy } from 'passport-headerapikey';
import { PassportStrategy } from '@nestjs/passport';
import { Inject, Injectable } from '@nestjs/common';
import { AuthService } from '../auth.service';
import { Account } from '../../accounts/entities/accounts.entity';
import { Workspaces } from '../../workspaces/entities/workspaces.entity';
import { Cache } from 'cache-manager';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { CacheService } from '../../../common/services/cache.service';
import { CacheConstants } from '../../../common/services/cache.constants';

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy) {
  constructor(
    @Inject(CacheService) private cacheService: CacheService,
    private authService: AuthService
  ) {
    super(
      { header: 'Authorization', prefix: 'Api-Key ' },
      true,
      async (apikey, done, req) => {
        let checkKey: { account: Account; workspace: Workspaces };
        try {
          checkKey = await this.cacheService.getIgnoreError(
            CacheConstants.API_KEY,
            apikey,
            async () => {
              return await this.authService.validateAPIKey(apikey);
            });
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
