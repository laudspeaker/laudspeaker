import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './shared/typeorm/typeorm.service';
import { ApiModule } from './api/api.module';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { AuthMiddleware } from './api/auth/middleware/auth.middleware';
import { EventsController } from './api/events/events.controller';
import { SlackMiddleware } from './api/slack/middleware/slack.middleware';
import { AppController } from './app.controller';
import { join } from 'path';
import { CronService } from './app.cron.service';
import { ScheduleModule } from '@nestjs/schedule';
import { Account } from './api/accounts/entities/accounts.entity';
import { Verification } from './api/auth/entities/verification.entity';
import { Integration } from './api/integrations/entities/integration.entity';
import { Template } from './api/templates/entities/template.entity';
import { Installation } from './api/slack/entities/installation.entity';
import { State } from './api/slack/entities/state.entity';
import { IntegrationsModule } from './api/integrations/integrations.module';
import { ServeStaticModule } from '@nestjs/serve-static';
import { Recovery } from './api/auth/entities/recovery.entity';
import { Segment } from './api/segments/entities/segment.entity';

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
import { RavenModule } from 'nest-raven';
import { JourneyLocation } from './api/journeys/entities/journey-location.entity';
import { JourneyLocationsService } from './api/journeys/journey-locations.service';
import { SegmentsModule } from './api/segments/segments.module';
import { OrganizationsModule } from './api/organizations/organizations.module';
import { OrganizationInvites } from './api/organizations/entities/organization-invites.entity';
import { redisStore } from 'cache-manager-redis-yet';
import { CacheModule } from '@nestjs/cache-manager';
import { HealthCheckService } from './app.healthcheck.service';
import { QueueModule } from './common/services/queue/queue.module';
import { ClickHouseModule } from './common/services/clickhouse/clickhouse.module';
import { ChannelsModule } from './api/channels/channels.module';
import { NotificationPreferenceModule } from './api/notification-preferences/notification-preferences.module';

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

function getProvidersList() {
  let providerList: Array<any> = [
    RedlockService,
    JourneyLocationsService,
    HealthCheckService,
  ];

  if (process.env.LAUDSPEAKER_PROCESS_TYPE == 'CRON') {
    providerList = [...providerList, CronService];
  }

  return providerList;
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
    ctx = JSON.parse(context as string);
  } catch (e) {}
  return `[${timestamp}] [${level}] [${process.env.LAUDSPEAKER_PROCESS_TYPE}-${
    process.pid
  }]${ctx?.class ? ' [Class: ' + ctx?.class + ']' : ''}${
    ctx?.method ? ' [Method: ' + ctx?.method + ']' : ''
  }${ctx?.session ? ' [User: ' + ctx?.user + ']' : ''}${
    ctx?.session ? ' [Session: ' + ctx?.session + ']' : ''
  }: ${message} ${stack ? '{stack: ' + stack : ''} ${
    ctx.cause ? 'cause: ' + ctx.cause : ''
  } ${ctx.message ? 'message: ' + ctx.message : ''} ${
    ctx.name ? 'name: ' + ctx.name + '}' : ''
  }`;
});

export const formatMongoConnectionString = (mongoConnectionString: string) => {
  if (mongoConnectionString) {
    if (mongoConnectionString.includes('mongodb+srv')) {
      return mongoConnectionString;
    } else if (
      !mongoConnectionString.includes('mongodb') &&
      !mongoConnectionString.includes('?directConnection=true')
    ) {
      return `mongodb://${mongoConnectionString}?directConnection=true`;
    } else if (!mongoConnectionString.includes('mongodb')) {
      return `mongodb://${mongoConnectionString}`;
    } else if (!mongoConnectionString.includes('?directConnection=true')) {
      return `${mongoConnectionString}?directConnection=true`;
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
    CacheModule.registerAsync({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          ttl: process.env.REDIS_CACHE_TTL
            ? +process.env.REDIS_CACHE_TTL
            : 5000,
          url: `redis://default:${process.env.REDIS_PASSWORD}@${
            process.env.REDIS_HOST
          }:${parseInt(process.env.REDIS_PORT)}`,
        }),
      }),
    }),
    QueueModule.forRoot({
      connection: {
        uri: process.env.RMQ_CONNECTION_URI ?? 'amqp://localhost',
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
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      Account,
      Verification,
      Integration,
      Segment,
      Template,
      Installation,
      State,
      Recovery,
      WebhookJob,
      JourneyLocation,
      OrganizationInvites,
    ]),
    ClickHouseModule.register({
      url: process.env.CLICKHOUSE_HOST
        ? process.env.CLICKHOUSE_HOST.includes('http')
          ? process.env.CLICKHOUSE_HOST
          : `http://${process.env.CLICKHOUSE_HOST}`
        : 'http://localhost:8123',
      username: process.env.CLICKHOUSE_USER ?? 'default',
      password: process.env.CLICKHOUSE_PASSWORD ?? '',
      database: process.env.CLICKHOUSE_DB ?? 'default',
      max_open_connections: process.env.CLICKHOUSE_MAX_OPEN_CONNECTIONS ?? 10,
      keep_alive: { enabled: true }
    }),
    IntegrationsModule,
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
    SegmentsModule,
    RedlockModule,
    RavenModule,
    OrganizationsModule,
    ChannelsModule,
    NotificationPreferenceModule
  ],
  controllers: [AppController],
  providers: getProvidersList(),
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
