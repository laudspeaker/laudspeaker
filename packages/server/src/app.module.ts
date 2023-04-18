import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './shared/typeorm/typeorm.service';
import { ApiModule } from './api/api.module';
import { WinstonModule } from 'nest-winston';
import { BullModule } from '@nestjs/bullmq';
import * as winston from 'winston';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthMiddleware } from './api/auth/middleware/auth.middleware';
import { EventsController } from './api/events/events.controller';
import { SlackMiddleware } from './api/slack/middleware/slack.middleware';
import { AppController } from './app.controller';
import { join, resolve } from 'path';
import { CronService } from './app.cron.service';
import { ScheduleModule } from '@nestjs/schedule';
import {
  Customer,
  CustomerSchema,
} from './api/customers/schemas/customer.schema';
import {
  CustomerKeys,
  CustomerKeysSchema,
} from './api/customers/schemas/customer-keys.schema';
import { Account } from './api/accounts/entities/accounts.entity';
import { Verification } from './api/auth/entities/verification.entity';
import { EventSchema, Event } from './api/events/schemas/event.schema';
import {
  EventKeys,
  EventKeysSchema,
} from './api/events/schemas/event-keys.schema';
import { Integration } from './api/integrations/entities/integration.entity';
import { Workflow } from './api/workflows/entities/workflow.entity';
import { Job } from './api/jobs/entities/job.entity';
import { Audience } from './api/audiences/entities/audience.entity';
import { Template } from './api/templates/entities/template.entity';
import { Installation } from './api/slack/entities/installation.entity';
import { State } from './api/slack/entities/state.entity';
import { IntegrationsModule } from './api/integrations/integrations.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { Recovery } from './api/auth/entities/recovery.entity';
import { Segment } from './api/segments/entities/segment.entity';
import { WorkflowsModule } from './api/workflows/workflows.module';
import { JobsModule } from './api/jobs/jobs.module';
import { AudiencesModule } from './api/audiences/audiences.module';
import { CustomersModule } from './api/customers/customers.module';
import { TemplatesModule } from './api/templates/templates.module';
import { SlackModule } from './api/slack/slack.module';
import { WebhookJobsModule } from './api/webhook-jobs/webhook-jobs.module';
import { WebhookJob } from './api/webhook-jobs/entities/webhook-job.entity';
import { AccountsModule } from './api/accounts/accounts.module';
import { WebsocketGateway } from './websocket.gateway';
import { CookiesModule } from './api/cookies/cookies.module';

const myFormat = winston.format.printf(function ({
  level,
  message,
  timestamp,
  ...metadata
}) {
  let filename;
  const oldStackTrace = Error.prepareStackTrace;

  const boilerplateLines = (line) =>
    line &&
    line.getFileName() &&
    // in the following line you may want to "play" with adding a '/' as a prefix/postfix to your module name
    line.getFileName().indexOf('<The Name of This Module>') &&
    line.getFileName().indexOf('/node_modules/') < 0;

  try {
    // eslint-disable-next-line handle-callback-err
    Error.prepareStackTrace = (err, structuredStackTrace) =>
      structuredStackTrace;
    // @ts-ignore
    Error.captureStackTrace(this);
    // we need to "peel" the first CallSites (frames) in order to get to the caller we're looking for
    // in our case we're removing frames that come from logger module or from winston
    // @ts-ignore
    const callSites = this.stack.filter(boilerplateLines);
    if (callSites.length === 0) {
      // bail gracefully: even though we shouldn't get here, we don't want to crash for a log print!
      return null;
    }
    const results = [];
    for (let i = 0; i < 1; i++) {
      const callSite = callSites[i];
      let fileName = callSite.getFileName();
      // BASE_DIR_NAME is the path to the project root folder
      fileName = fileName.includes(resolve('.'))
        ? fileName.substring(resolve('.').length + 1)
        : fileName;
      results.push(fileName + ':' + callSite.getLineNumber());
    }
    filename = results.join('\n');
    return `[${level}] [${filename}] [${timestamp}] ${message} ${JSON.stringify(
      metadata
    )}`;
  } finally {
    Error.prepareStackTrace = oldStackTrace;
  }
});

const formatMongoConnectionString = (mongoConnectionString: string) => {
  if (mongoConnectionString) {
    if (mongoConnectionString.includes('mongodb+srv')) {
      return mongoConnectionString;
    } else if (
      !mongoConnectionString.includes('mongodb') &&
      !mongoConnectionString.includes('?directConnection=true')
    ) {
      return `mongodb://${mongoConnectionString}/?directConnection=true`;
    } else if (!mongoConnectionString.includes('mongodb')) {
      return `mongodb://${mongoConnectionString}`;
    } else if (!mongoConnectionString.includes('?directConnection=true')) {
      return `${mongoConnectionString}/?directConnection=true`;
    } else return mongoConnectionString;
  }
};

@Module({
  imports: [
    ...(process.env.SERVE_CLIENT_FROM_NEST
      ? [
          ServeStaticModule.forRoot({
            rootPath: process.env.CLIENT_PATH
              ? process.env.CLIENT_PATH
              : join(__dirname, '../../../', 'client/build/'),
            exclude: ['api/*'],
          }),
        ]
      : []),
    MongooseModule.forRoot(
      process.env.MONGOOSE_URL
      // ? formatMongoConnectionString(process.env.MONGOOSE_URL)
      // : 'mongodb://127.0.0.1:27017/?directConnection=true'
    ),
    BullModule.forRoot({
      connection: {
        host: process.env.REDIS_HOST ?? 'localhost',
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
        retryStrategy: (times: number) => {
          return Math.max(Math.min(Math.exp(times), 20000), 1000);
        },
        maxRetriesPerRequest: null,
        enableOfflineQueue: true,
      },
    }),
    WinstonModule.forRootAsync({
      useFactory: () => ({
        level: 'debug',
        transports: [
          new winston.transports.Console({
            handleExceptions: true,
            format: winston.format.combine(
              winston.format.colorize(),
              winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
              myFormat
            ),
          }),
        ],
      }),
      inject: [],
    }),
    TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService }),
    ApiModule,
    MongooseModule.forFeature([
      { name: Customer.name, schema: CustomerSchema },
      { name: CustomerKeys.name, schema: CustomerKeysSchema },
      { name: Event.name, schema: EventSchema },
      { name: EventKeys.name, schema: EventKeysSchema },
    ]),
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      Account,
      Verification,
      Integration,
      Workflow,
      Job,
      Segment,
      Audience,
      Template,
      Installation,
      State,
      Recovery,
      WebhookJob,
    ]),
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
    IntegrationsModule,
    WorkflowsModule,
    JobsModule,
    AudiencesModule,
    CustomersModule,
    TemplatesModule,
    SlackModule,
    WebhookJobsModule,
    AccountsModule,
    CookiesModule,
  ],
  controllers: [AppController],
  providers: [CronService, WebsocketGateway],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(AuthMiddleware)
      .forRoutes(EventsController)
      .apply(SlackMiddleware)
      .forRoutes({ path: '/slack/events', method: RequestMethod.POST });
  }
}
