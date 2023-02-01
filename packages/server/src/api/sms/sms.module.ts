import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { SmsController } from './sms.controller';
import { SmsProcessor } from './sms.processor';
import { SmsService } from './sms.service';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'sms',
    }),
  ],
  controllers: [SmsController],
  providers: [SmsService, SmsProcessor],
  exports: [SmsService],
})
export class SmsModule { }
