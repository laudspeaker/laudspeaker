import {
  ClassSerializerInterceptor,
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { SmsService } from './sms.service';

@Controller('sms')
export class SmsController {
  constructor(private smsService: SmsService) {}

  @Get('possible-phone-numbers')
  @UseGuards(JwtAuthGuard)
  @UseInterceptors(ClassSerializerInterceptor)
  public async getPossiblePhoneNumbers(
    @Query('smsAccountSid') smsAccountSid: string,
    @Query('smsAuthToken') smsAuthToken: string
  ) {
    return this.smsService.getPossiblePhoneNumbers(smsAccountSid, smsAuthToken);
  }
}
