import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-github';

@Injectable()
export class GithubOauthStrategy extends PassportStrategy(Strategy, 'github') {
  constructor() {
    super({
      clientID: process.env.GITHUB_OAUTH_CLIENT_ID,
      clientSecret: process.env.GITHUB_OAUTH_CLIENT_SECRET,
      callbackURL: process.env.GITHUB_OAUTH_CALLBACK_URL,
      scope: ['user:email'],
    });
  }

  async validate(accessToken: string, _refreshToken: string, profile: Profile) {
    const { id } = profile;
    console.log('Profile:');
    console.log(profile);
    // const user = await this.usersService.findOrCreate(id, 'github');
    // if (!user) {
    //   // TODO Depending on the concrete implementation of findOrCreate(), throwing the
    //   // UnauthorizedException here might not make sense...
    //   throw new UnauthorizedException();
    // }
    return profile;
  }
}
