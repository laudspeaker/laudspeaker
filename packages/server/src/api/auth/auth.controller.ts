import {
  Body,
  Controller,
  Inject,
  Post,
  ClassSerializerInterceptor,
  UseInterceptors,
  UseGuards,
  Req,
  Get,
  Patch,
  Param,
  Logger,
} from '@nestjs/common';
import { Account } from '../accounts/entities/accounts.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from '../auth/dto/register.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { AuthService } from './auth.service';
import { Request } from 'express';
import { RequestResetPasswordDto } from './dto/request-reset-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { randomUUID } from 'crypto';
import { RavenInterceptor } from 'nest-raven';

@Controller('auth')
export class AuthController {
  constructor(
    @Inject(AuthService)
    public readonly service: AuthService,
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger
  ) {}

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: AuthController.name,
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
        class: AuthController.name,
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
        class: AuthController.name,
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
        class: AuthController.name,
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
        class: AuthController.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  @Post('register')
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  public async register(@Body() body: RegisterDto) {
    const session = randomUUID();
    this.debug(
      `Registering user ${JSON.stringify(body)}`,
      this.register.name,
      session
    );
    try {
      return await this.service.register(body, session);
    } catch (e) {
      this.error(e, this.register.name, session);
      throw e;
    }
  }

  @Post('login')
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  public async login(@Body() body: LoginDto) {
    const session = randomUUID();
    this.debug(`Logging in: ${JSON.stringify(body)}`, this.login.name, session);
    try {
      return await this.service.login(body, session);
    } catch (e) {
      this.error(e, this.login.name, session);
      throw e;
    }
  }

  @Post('refresh')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  public async refresh(@Req() { user }: Request): Promise<string | never> {
    const session = randomUUID();
    this.debug(
      `Refreshing JWT: ${JSON.stringify({ id: (<Account>user).id })}`,
      this.refresh.name,
      session,
      (<Account>user).id
    );
    try {
      return await this.service.refresh(<Account>user, session);
    } catch (e) {
      this.error(e, this.refresh.name, session, (<Account>user).id);
      throw e;
    }
  }

  @Patch('verify-email/:id')
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  @UseGuards(JwtAuthGuard)
  public async verifyEmail(@Req() { user }: Request, @Param('id') id: string) {
    const session = randomUUID();
    this.debug(
      `Verifying email: ${JSON.stringify({
        user: (<Account>user).id,
        id: id,
      })}`,
      this.verifyEmail.name,
      session,
      (<Account>user).id
    );
    try {
      return await this.service.verifyEmail(<Account>user, id, session);
    } catch (e) {
      this.error(e, this.verifyEmail.name, session, (<Account>user).id);
      throw e;
    }
  }

  @Patch('resend-email')
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  @UseGuards(JwtAuthGuard)
  public async resendEmail(@Req() { user }: Request) {
    const session = randomUUID();
    this.debug(
      `Resending email: ${JSON.stringify({ id: (<Account>user).id })}`,
      this.resendEmail.name,
      session,
      (<Account>user).id
    );
    try {
      return await this.service.requestVerification(
        <Account>user,
        undefined,
        session
      );
    } catch (e) {
      this.error(e, this.resendEmail.name, session, (<Account>user).id);
      throw e;
    }
  }

  @Post('reset-password')
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  public async requestResetPassword(
    @Body() requestResetPasswordDto: RequestResetPasswordDto
  ) {
    const session = randomUUID();
    this.debug(
      `Reset password request: ${JSON.stringify(requestResetPasswordDto)}`,
      this.requestResetPassword.name,
      session
    );
    try {
      return await this.service.requestResetPassword(
        requestResetPasswordDto,
        session
      );
    } catch (e) {
      this.error(e, this.requestResetPassword.name, session);
      throw e;
    }
  }

  @Post('reset-password/:id')
  @UseInterceptors(ClassSerializerInterceptor, new RavenInterceptor())
  public async resetPassword(
    @Body() resetPasswordDto: ResetPasswordDto,
    @Param('id') id: string
  ) {
    const session = randomUUID();
    this.debug(
      `Resetting password: ${JSON.stringify({
        id: id,
        dto: resetPasswordDto,
      })}`,
      this.resetPassword.name,
      session
    );
    try {
      return await this.service.resetPassword(resetPasswordDto, id, session);
    } catch (e) {
      this.error(e, this.resetPassword.name, session);
      throw e;
    }
  }
}
