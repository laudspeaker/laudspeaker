import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Inject,
  Logger,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SmsService } from './sms.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { randomUUID } from 'crypto';

@Controller('sms')
export class SmsController {
  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER)
    private readonly logger: Logger,
    private smsService: SmsService
  ) {}

  log(message, method, session, user = 'ANONYMOUS') {
    this.logger.log(
      message,
      JSON.stringify({
        class: SmsController.name,
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
        class: SmsController.name,
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
        class: SmsController.name,
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
        class: SmsController.name,
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
        class: SmsController.name,
        method: method,
        session: session,
        user: user,
      })
    );
  }

  @Get('possible-phone-numbers')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async getPossiblePhoneNumbers(
    @Query('smsAccountSid') smsAccountSid: string,
    @Query('smsAuthToken') smsAuthToken: string
  ) {
    const session = randomUUID();
    return this.smsService.getPossiblePhoneNumbers(
      smsAccountSid,
      smsAuthToken,
      session
    );
  }
}
