import {
  MiddlewareConsumer,
  Module,
  NestModule,
  RequestMethod,
} from '@nestjs/common';
import { WebhooksService } from './webhooks.service';
import { WebhooksController } from './webhooks.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WebhookEvent } from './entities/webhook-event.entity';
import { Account } from '../accounts/entities/accounts.entity';
import { Audience } from '../audiences/entities/audience.entity';
import twilio from 'twilio';

@Module({
  imports: [TypeOrmModule.forFeature([Account, Audience, WebhookEvent])],
  providers: [WebhooksService],
  controllers: [WebhooksController],
})
export class WebhooksModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(twilio.webhook())
      .forRoutes({ path: '/webhooks/twillio', method: RequestMethod.POST });
  }
}
