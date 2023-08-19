import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './shared/typeorm/typeorm.service';
import { ApiModule } from './api/api.module';
import { WinstonModule } from 'nest-winston';
import { BullModule } from '@taskforcesh/nestjs-bullmq-pro';
import * as winston from 'winston';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthMiddleware } from './api/auth/middleware/auth.middleware';
import { EventsController } from './api/events/events.controller';
import { SlackMiddleware } from './api/slack/middleware/slack.middleware';
import { AppController } from './app.controller';
import { join } from 'path';
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
import { StepsModule } from './api/steps/steps.module';
import { EventsModule } from './api/events/events.module';
import { ModalsModule } from './api/modals/modals.module';
import { WebsocketsModule } from './websockets/websockets.module';
import traverse from 'traverse';
import { klona } from 'klona/full';
import { JourneysModule } from './api/journeys/journeys.module';
import { RedlockModule } from './api/redlock/redlock.module';
import { RedlockService } from './api/redlock/redlock.service';

const sensitiveKeys = [
  /cookie/i,
  /passw(or)?d/i,
  /^pw$/,
  /^pass$/i,
  /secret/i,
  /token/i,
  /api[-._]?key/i,
];

function isSensitiveKey(keyStr) {
  if (keyStr) {
    return sensitiveKeys.some((regex) => regex.test(keyStr));
  }
}

function redactObject(obj: any) {
  traverse(obj).forEach(function redactor(this: any) {
    if (isSensitiveKey(this.key)) {
      this.update('[REDACTED]');
    }
  });
}

function redact(obj) {
  const copy = klona(obj); // Making a deep copy to prevent side effects
  redactObject(copy);

  const splat = copy[Symbol.for('splat')];
  redactObject(splat); // Specifically redact splat Symbol

  return copy;
}

const myFormat = winston.format.printf(function ({
  timestamp,
  context,
  level,
  message,
  stack,
}) {
  let ctx: any = {};
  try {
    ctx = JSON.parse(context);
  } catch (e) {}
  return `[${timestamp}] [${level}]${
    ctx?.class ? ' [Class: ' + ctx?.class + ']' : ''
  }${ctx?.method ? ' [Method: ' + ctx?.method + ']' : ''}${
    ctx?.session ? ' [User: ' + ctx?.user + ']' : ''
  }${ctx?.session ? ' [Session: ' + ctx?.session + ']' : ''}: ${message} ${
    stack ? '{stack: ' + stack : ''
  } ${ctx.cause ? 'cause: ' + ctx.cause : ''} ${
    ctx.message ? 'message: ' + ctx.message : ''
  } ${ctx.name ? 'name: ' + ctx.name + '}' : ''}`;
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
      formatMongoConnectionString(process.env.MONGOOSE_URL)
      // process.env.MONGOOSE_URL
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
    // MorganLoggerModule,
    // MorganLoggerModule.forRoot({ name: 'HTTPLogger', format: "combined" }),
    WinstonModule.forRootAsync({
      useFactory: () => ({
        level: process.env.LOG_LEVEL || 'debug',
        transports: [
          new winston.transports.Console({
            handleExceptions: true,
            format: winston.format.combine(
              winston.format((info) => redact(info))(), // Prevent logging sensitive data
              winston.format.colorize({ all: true }),
              winston.format.align(),
              winston.format.errors({ stack: true }),
              winston.format.timestamp({ format: 'YYYY-MM-DD hh:mm:ss.SSS A' }),
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
    BullModule.registerQueue({
      name: 'transition',
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
    EventsModule,
    ModalsModule,
    WebsocketsModule,
    StepsModule,
    JourneysModule,
    RedlockModule,
  ],
  controllers: [AppController],
  providers: [CronService, RedlockService],
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
