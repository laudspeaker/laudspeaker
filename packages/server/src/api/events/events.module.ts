import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsController } from './events.controller';
import { EventsService } from './events.service';
import { Account } from '../accounts/entities/accounts.entity';
import { Template } from '../templates/entities/template.entity';
import { Installation } from '../slack/entities/installation.entity';
import { State } from '../slack/entities/state.entity';
import { AuthModule } from '../auth/auth.module';
import { CustomersModule } from '../customers/customers.module';
import { AccountsModule } from '../accounts/accounts.module';
import { TemplatesModule } from '../templates/templates.module';
import { SlackModule } from '../slack/slack.module';
import { EventsProcessor } from './processors/events.processor';
import { JourneysModule } from '../journeys/journeys.module';
import { SegmentsModule } from '../segments/segments.module';
import { EventsPreProcessor } from './processors/events.preprocessor';
import { WebsocketsModule } from '@/websockets/websockets.module';
import { RedlockModule } from '../redlock/redlock.module';
import { RedlockService } from '../redlock/redlock.service';
import { JourneyLocationsService } from '../journeys/journey-locations.service';
import { JourneyLocation } from '../journeys/entities/journey-location.entity';
import { CustomersService } from '../customers/customers.service';
import { Imports } from '../customers/entities/imports.entity';
import { StepsModule } from '../steps/steps.module';
import { S3Service } from '../s3/s3.service';
import { Step } from '../steps/entities/step.entity';
import { Journey } from '../journeys/entities/journey.entity';
import { WebhooksModule } from '../webhooks/webhooks.module';
import { CacheService } from '../../common/services/cache.service';
import { OrganizationsModule } from '../organizations/organizations.module';
import { EventsPostProcessor } from './processors/events.postprocessor';
import { Customer } from '../customers/entities/customer.entity';
import { EventsPGSyncProcessor } from './processors/events-pg-sync.processor';
import { PGEvent } from '../events/entities/pg-event.entity';
import { NotificationPreferenceModule } from '../notification-preferences/notification-preferences.module';
import { NotificationPreferenceService } from '../notification-preferences/notification-preferences.service';
import { NotificationPreference } from '../notification-preferences/entities/notification-preference.entity';

function getProvidersList() {
  let providerList: Array<any> = [
    EventsService,
    RedlockService,
    JourneyLocationsService,
    CustomersService,
    S3Service,
    CacheService,
    NotificationPreferenceService,
  ];

  if (process.env.LAUDSPEAKER_PROCESS_TYPE == 'QUEUE') {
    providerList = [
      ...providerList,
      EventsProcessor,
      EventsPreProcessor,
      EventsPostProcessor,
      EventsPGSyncProcessor
    ];
  }

  return providerList;
}

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Account,
      Customer,
      Installation,
      State,
      Template,
      JourneyLocation,
      Imports,
      Step,
      Journey,
      PGEvent,
      NotificationPreference
    ]),
    forwardRef(() => AuthModule),
    forwardRef(() => CustomersModule),
    forwardRef(() => WebhooksModule),
    forwardRef(() => AccountsModule),
    forwardRef(() => TemplatesModule),
    forwardRef(() => JourneysModule),
    forwardRef(() => SegmentsModule),
    forwardRef(() => WebsocketsModule),
    forwardRef(() => NotificationPreferenceModule),
    SlackModule,
    forwardRef(() => RedlockModule),
    forwardRef(() => StepsModule),
    forwardRef(() => OrganizationsModule),
  ],
  controllers: [EventsController],
  providers: getProvidersList(),
  exports: [EventsService],
})
export class EventsModule { }
