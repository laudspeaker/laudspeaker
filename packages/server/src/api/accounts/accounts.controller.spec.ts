import { TypeOrmConfigService } from '../../shared/typeorm/typeorm.service';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';
import { AuthModule } from '../auth/auth.module';
import { AccountsController } from './accounts.controller';
import { AccountsService } from './accounts.service';
import { Account } from './entities/accounts.entity';
import * as winston from 'winston';
import { S3Service } from '../s3/s3.service';
import { AudiencesHelper } from '../audiences/audiences.helper';
import { CustomersProcessor } from '../customers/customers.processor';
import { CustomersService } from '../customers/customers.service';
import { CustomersModule } from '../customers/customers.module';
import { SegmentsService } from '../segments/segments.service';
import { Segment } from '../segments/entities/segment.entity';
import { SegmentCustomers } from '../segments/entities/segment-customers.entity';
import { WorkflowsService } from '../workflows/workflows.service';
import { Workflow } from '../workflows/entities/workflow.entity';
import { AudiencesService } from '../audiences/audiences.service';
import {
  EventKeys,
  EventKeysSchema,
} from '../events/schemas/event-keys.schema';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import {
  CustomerKeys,
  CustomerKeysSchema,
} from '../customers/schemas/customer-keys.schema';
import { Audience } from '../audiences/entities/audience.entity';
import { TemplatesService } from '../templates/templates.service';
import { JobsService } from '../jobs/jobs.service';
import { Job } from '../jobs/entities/job.entity';
import { Template } from '../templates/entities/template.entity';
import { WebsocketGateway } from '../../websockets/websocket.gateway';
import { WebhooksService } from '../webhooks/webhooks.service';
import { EventsService } from '../events/events.service';
import { Event, EventSchema } from '../events/schemas/event.schema';
import {
  PosthogEvent,
  PosthogEventSchema,
} from '../events/schemas/posthog-event.schema';
import {
  PosthogEventType,
  PosthogEventTypeSchema,
} from '../events/schemas/posthog-event-type.schema';
import { SlackService } from '../slack/slack.service';
import { Installation } from '../slack/entities/installation.entity';
import { State } from '../slack/entities/state.entity';
import { ModalsService } from '../modals/modals.service';
import { ModalEvent } from '../modals/entities/modal-event.entity';

const papertrail = new winston.transports.Http({
  host: 'logs.collector.solarwinds.com',
  path: '/v1/log',
  auth: { username: 'papertrail', password: process.env.PAPERTRAIL_API_KEY },
  ssl: true,
});

describe('UsersController', () => {
  let accountsController: AccountsController;
  let accountsService: AccountsService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(process.env.MONGOOSE_URL),
        MongooseModule.forFeature([
          { name: EventKeys.name, schema: EventKeysSchema },
          { name: Customer.name, schema: CustomerSchema },
          { name: CustomerKeys.name, schema: CustomerKeysSchema },
          { name: Event.name, schema: EventSchema },
          { name: PosthogEvent.name, schema: PosthogEventSchema },
          { name: PosthogEventType.name, schema: PosthogEventTypeSchema },
        ]),
        BullModule.forRoot({
          connection: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT),
            password: process.env.REDIS_PASSWORD,
          },
        }),
        BullModule.registerQueue({
          name: 'integrations',
        }),
        BullModule.registerQueue({
          name: 'events',
        }),
        BullModule.registerQueue({
          name: 'customers',
        }),
        BullModule.registerQueue({
          name: 'message',
        }),
        BullModule.registerQueue({
          name: 'slack',
        }),
        BullModule.registerQueue({
          name: 'webhooks',
        }),
        WinstonModule.forRootAsync({
          useFactory: () => ({
            level: 'debug',
            transports: [papertrail],
          }),
          inject: [],
        }),
        TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService }),
        TypeOrmModule.forFeature([
          Account,
          Audience,
          Segment,
          SegmentCustomers,
          Workflow,
          Job,
          Template,
          Installation,
          State,
          ModalEvent,
        ]),
        AuthModule,
        CustomersModule,
      ],
      controllers: [AccountsController],
      providers: [
        AccountsService,
        S3Service,
        CustomersService,
        CustomersProcessor,
        AudiencesHelper,
        SegmentsService,
        WorkflowsService,
        AudiencesService,
        JobsService,
        TemplatesService,
        WebsocketGateway,
        WebhooksService,
        EventsService,
        SlackService,
        ModalsService,
      ],
    }).compile();

    accountsController = app.get<AccountsController>(AccountsController);
    accountsService = app.get<AccountsService>(AccountsService);
  });

  it('should be defined', () => {
    expect(accountsController).toBeDefined();
  });
});
