import {
  Controller,
  Get,
  HttpException,
  HttpStatus,
  Inject,
  Logger,
  UseInterceptors,
} from '@nestjs/common';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { randomUUID } from 'crypto';
import { RavenInterceptor } from 'nest-raven';
@Controller()
export class AppController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger
  ) {}

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: AppController.name,
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
        class: AppController.name,
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
        class: AppController.name,
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
        class: AppController.name,
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
        class: AppController.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  @UseInterceptors(new RavenInterceptor())
  @Get()
  root() {
    const session = randomUUID();
    this.debug(`GET / `, this.root.name, session);
    return 'laudspeaker API v 1.0';
  }

  @UseInterceptors(new RavenInterceptor())
  @Get('/sentry-test')
  sentryTest() {
    const session = randomUUID();
    this.debug(`GET / `, this.root.name, session);
    throw new HttpException('sentry-online', HttpStatus.INTERNAL_SERVER_ERROR);
  }

  @UseInterceptors(new RavenInterceptor())
  @Get('/allowed')
  allowed() {
    const session = randomUUID();
    this.debug(`GET / `, this.root.name, session);
    let allowedRoutes = {};
    if (process.env.EMAIL_VERIFICATION == 'false') {
      allowedRoutes['verified_not_allowed'] = true;
    }
    if (process.env.SLACK_OPTIONAL == 'true') {
      allowedRoutes['slack_not_allowed'] = true;
    }
    return allowedRoutes;
  }
}
