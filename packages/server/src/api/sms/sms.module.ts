import { Module } from '@nestjs/common';
import { SmsController } from './sms.controller';
import { SmsProcessor } from './sms.processor';
import { SmsService } from './sms.service';

@Module({
  controllers: [SmsController],
  providers: [SmsService, SmsProcessor],
  exports: [SmsService],
})
export class SmsModule {}
