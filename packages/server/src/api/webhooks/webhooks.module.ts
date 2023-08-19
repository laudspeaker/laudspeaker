import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import twilio from 'twilio';
import { WebhooksProcessor } from './webhooks.processor';
import { BullModule } from '@taskforcesh/nestjs-bullmq-pro';
import { TemplatesModule } from '../templates/templates.module';
import { Step } from '../steps/entities/step.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, Step]),
    BullModule.registerQueue({
      name: 'webhooks',
    }),
    TemplatesModule,
  ],
  providers: [WebhooksService, WebhooksProcessor],
  controllers: [WebhooksController],
  exports: [WebhooksService],
})
export class WebhooksModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(twilio.webhook())
      .forRoutes({ path: '/webhooks/twilio', method: RequestMethod.POST });
  }
}
