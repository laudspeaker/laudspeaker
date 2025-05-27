import { Module, forwardRef } from '@nestjs/common';
import { StepsService } from './steps.service';
import { StepsController } from './steps.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Step } from './entities/step.entity';
import { JobsService } from '../jobs/jobs.service';
import { Template } from '../templates/entities/template.entity';
import { Job } from '../jobs/entities/job.entity';
import { SlackModule } from '../slack/slack.module';
import { CustomersModule } from '../customers/customers.module';
import { TemplatesModule } from '../templates/templates.module';
import { Account } from '../accounts/entities/accounts.entity';
import { AccountsModule } from '../accounts/accounts.module';
import { EventsModule } from '../events/events.module';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { ModalsModule } from '../modals/modals.module';
import { WebsocketsModule } from '@/websockets/websockets.module';
import { RedlockModule } from '../redlock/redlock.module';
import { RedlockService } from '../redlock/redlock.service';
import { StartProcessor } from '../journeys/processors/start.processor';
import { EnrollmentProcessor } from '../journeys/processors/enrollment.processor';
import { JourneyLocationsService } from '../journeys/journey-locations.service';
import { JourneyLocation } from '../journeys/entities/journey-location.entity';
import { JourneysModule } from '../journeys/journeys.module';
import { Requeue } from './entities/requeue.entity';
import { OrganizationsModule } from '../organizations/organizations.module';
import { Workspaces } from '../workspaces/entities/workspaces.entity';
import { WorkspacesModule } from '../workspaces/workspaces.module';
import { CacheService } from '../../common/services/cache.service';
import { ExitStepProcessor } from './processors/exit.step.processor';
import { ExperimentStepProcessor } from './processors/experiment.step.processor';
import { JumpToStepProcessor } from './processors/jump.to.step.processor';
import { MessageStepProcessor } from './processors/message.step.processor';
import { MultisplitStepProcessor } from './processors/multisplit.step.processor';
import { StartStepProcessor } from './processors/start.step.processor';
import { TimeDelayStepProcessor } from './processors/time.delay.step.processor';
import { TimeWindowStepProcessor } from './processors/time.window.step.processor';
import { WaitUntilStepProcessor } from './processors/wait.until.step.processor';
import { SegmentsModule } from '../segments/segments.module';
import { StepsHelper } from './steps.helper';
import { NotificationPreferenceModule } from '../notification-preferences/notification-preferences.module';
import { NotificationPreferenceService } from '../notification-preferences/notification-preferences.service';
import { NotificationPreference } from '../notification-preferences/entities/notification-preference.entity';

function getProvidersList() {
  let providerList: Array<any> = [
    StepsService,
    JobsService,
    RedlockService,
    JourneyLocationsService,
    CacheService,
    StepsHelper,
    NotificationPreferenceService,
  ];

  if (process.env.LAUDSPEAKER_PROCESS_TYPE == 'QUEUE') {
    providerList = [
      ...providerList,
      StartProcessor,
      EnrollmentProcessor,
      ExitStepProcessor,
      ExperimentStepProcessor,
      JumpToStepProcessor,
      MessageStepProcessor,
      MultisplitStepProcessor,
      StartStepProcessor,
      TimeDelayStepProcessor,
      TimeWindowStepProcessor,
      WaitUntilStepProcessor,
    ];
  }

  return providerList;
}

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Step,
      Template,
      Job,
      Account,
      JourneyLocation,
      Requeue,
      Workspaces,
      NotificationPreference,
    ]),
    forwardRef(() => CustomersModule),
    forwardRef(() => WebhooksModule),
    forwardRef(() => TemplatesModule),
    forwardRef(() => AccountsModule),
    forwardRef(() => EventsModule),
    forwardRef(() => ModalsModule),
    forwardRef(() => WebsocketsModule),
    forwardRef(() => RedlockModule),
    forwardRef(() => JourneysModule),
    forwardRef(() => OrganizationsModule),
    forwardRef(() => WorkspacesModule),
    forwardRef(() => SegmentsModule),
    forwardRef(() => NotificationPreferenceModule),
    SlackModule,
  ],
  providers: getProvidersList(),
  controllers: [StepsController],
  exports: [StepsService, StepsHelper],
})
export class StepsModule { }
