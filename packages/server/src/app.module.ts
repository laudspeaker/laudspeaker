import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TypeOrmConfigService } from './shared/typeorm/typeorm.service';
import { ApiModule } from './api/api.module';
import { WinstonModule } from 'nest-winston';
import { BullModule } from '@nestjs/bull';
import * as winston from 'winston';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthMiddleware } from './api/auth/middleware/auth.middleware';
import { EventsController } from './api/events/events.controller';
import { SlackMiddleware } from './api/slack/middleware/slack.middleware';
import { AppController } from './app.controller';
import { resolve } from 'path';
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
import { SendgridEvent } from './api/webhooks/entities/sendgrid-event.entity';
import { EventSchema, Event } from './api/events/schemas/event.schema';
import {
  EventKeys,
  EventKeysSchema,
} from './api/events/schemas/event-keys.schema';

const papertrail = new winston.transports.Http({
  host: 'logs.collector.solarwinds.com',
  path: '/v1/log',
  auth: { username: 'papertrail', password: process.env.PAPERTRAIL_API_KEY },
  ssl: true,
});

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

@Module({
  imports: [
    MongooseModule.forRoot(process.env.MONGOOSE_URL),
    BullModule.forRoot({
      redis: {
        host: process.env.REDIS_HOST,
        port: parseInt(process.env.REDIS_PORT),
        password: process.env.REDIS_PASSWORD,
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
    TypeOrmModule.forFeature([Account, Verification, SendgridEvent]),
  ],
  controllers: [AppController],
  providers: [CronService],
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
