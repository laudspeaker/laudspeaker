import {
  Injectable,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { createHmac } from 'crypto';

@Injectable()
export class SlackMiddleware implements NestMiddleware {
  use(req: any, res: any, next: (error?: any) => void) {
    const hmac = createHmac('sha256', process.env.SLACK_SIGNING_SECRET);
    const [version, hash] = (req.headers['x-slack-signature'] as string).split(
      '='
    );
    if (req.rawBody) {
      hmac.update(
        `${version}:${parseInt(
          req.headers['x-slack-request-timestamp'] as string,
          10
        )}:${req.rawBody.toString()}`
      );
      const digest = hmac.digest('hex');
      if (hash == digest) {
        next();
      } else {
        throw new UnauthorizedException();
      }
    }
  }
}
