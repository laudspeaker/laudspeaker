import {
  Controller,
  Get,
  Inject,
  Post,
  Req,
  Res,
  Body,
  Param,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { SlackService } from './slack.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Account } from '../accounts/entities/accounts.entity';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { randomUUID } from 'crypto';

enum ResponseStatus {
  Ok = 200,
  Redirect = 302,
  NotFound = 404,
  Failure = 500,
}

@Controller('slack')
export class SlackController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    @Inject(SlackService) private readonly slackService: SlackService
  ) {}

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: SlackController.name,
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
        class: SlackController.name,
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
        class: SlackController.name,
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
        class: SlackController.name,
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
        class: SlackController.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  @Get('install')
  async install() {
    const session = randomUUID();
    return await this.slackService.handleInstallPath(session);
  }

  @Get('oauth_redirect')
  redirect(@Req() req: Request, @Res() res: Response) {
    const session = randomUUID();
    this.slackService.handleOAuthRedirect(req, res, session);
  }

  /*
   * to do: need to check and modify for enterprise installs, what if account is not found?
   *
   * Adds slack team id to user object
   */
  @Get('cor/:teamid')
  @UseGuards(JwtAuthGuard)
  async cor(@Param('teamid') teamid: string, @Req() { user }: Request) {
    const session = randomUUID();
    return await this.slackService.handleCorrelation(
      teamid,
      <Account>user,
      session
    );
  }
}
