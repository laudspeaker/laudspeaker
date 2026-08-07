import { forwardRef, Module } from '@nestjs/common';
import { SlackProcessor } from './slack.processor';
import { SlackController } from './slack.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Installation } from './entities/installation.entity';
import { SlackService } from './slack.service';
import { Account } from '../accounts/entities/accounts.entity';
import { State } from './entities/state.entity';
import { CustomersModule } from '../customers/customers.module';
import { WebhooksService } from '../webhooks/webhooks.service';
import { Step } from '../steps/entities/step.entity';
import { Workspaces } from '../workspaces/entities/workspaces.entity';
import { Organization } from '../organizations/entities/organization.entity';
import { OrganizationPlan } from '../organizations/entities/organization-plan.entity';
import { CacheService } from '@/common/services/cache.service';

function getProvidersList() {
  let providerList: Array<any> = [SlackService, WebhooksService, CacheService];

  if (process.env.LAUDSPEAKER_PROCESS_TYPE == 'QUEUE') {
    providerList = [...providerList, SlackProcessor];
  }

  return providerList;
}

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      Installation,
      State,
      Step,
      Workspaces,
      Organization,
      OrganizationPlan,
    ]),
    forwardRef(() => CustomersModule),
  ],
  controllers: [SlackController],
  providers: getProvidersList(),
  exports: [SlackService],
})
export class SlackModule { }
