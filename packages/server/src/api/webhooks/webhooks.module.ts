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
import { TemplatesModule } from '../templates/templates.module';
import { Step } from '../steps/entities/step.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { OrganizationPlan } from '../organizations/entities/organization-plan.entity';
import { Workspaces } from '../workspaces/entities/workspaces.entity';
import { CacheService } from '../../common/services/cache.service';

function getProvidersList() {
  let providerList: Array<any> = [WebhooksService, CacheService];

  if (process.env.LAUDSPEAKER_PROCESS_TYPE == 'QUEUE') {
    providerList = [...providerList, WebhooksProcessor];
  }

  return providerList;
}

@Module({
  imports: [
    TypeOrmModule.forFeature([Account, Step, Organization, OrganizationPlan, Workspaces]),
    TemplatesModule,
  ],
  providers: getProvidersList(),
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
