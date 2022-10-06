import { MiddlewareConsumer, Module, RequestMethod } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { getEnvPath } from './common/helper/env.helper';
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
import { basename } from 'path';

const logLevel = 'debug';
const papertrail = new winston.transports.Http({
  host: 'logs.collector.solarwinds.com',
  path: '/v1/log',
  auth: { username: 'papertrail', password: process.env.PAPERTRAIL_API_KEY },
  ssl: true,
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
            format: winston.format.combine(
              winston.format.label({
                label: basename(process.mainModule.filename),
              }),
              winston.format.colorize(),
              winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
              winston.format.prettyPrint({ depth: 10 }),
              winston.format.printf(
                ({ level, message, label, timestamp }) =>
                  `${timestamp} ${level} [${label}]: ${message}`
              )
            ),
          }),
        ],
      }),
      inject: [],
    }),
    TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService }),
    ApiModule,
  ],
  controllers: [AppController],
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
