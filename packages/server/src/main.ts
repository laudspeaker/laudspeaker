// DO NOT IMPORT ANYTHING BEFORE TRACER
import './tracer';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { urlencoded } from 'body-parser';
import { readFileSync } from 'fs';
import * as Sentry from '@sentry/node';
import { setTimeout as originalSetTimeout } from 'timers';
import { setInterval as originalSetInterval } from 'timers';
import express from 'express';
import cluster from 'cluster';
import * as os from 'os';

const morgan = require('morgan');
/*
const numCPUs = os.cpus().length;

if (cluster.isPrimary) {
  console.log(`Primary ${process.pid} is running`);

  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on('exit', (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  */
  const expressApp = express();

  Sentry.init({
    dsn: process.env.SENTRY_DSN_URL_BACKEND,
    release: process.env.SENTRY_RELEASE,
    integrations: [
      new Sentry.Integrations.Express({
        app: expressApp,
      }),
      ...Sentry.autoDiscoverNodePerformanceMonitoringIntegrations(),
    ],
    // Performance Monitoring
    tracesSampleRate: 1.0, // Capture 100% of the transactions, reduce in production!
    // Set sampling rate for profiling - this is relative to tracesSampleRate
    profilesSampleRate: 1.0, // Capture 100% of the transactions, reduce in production!
  });

  if (process.env.SENTRY_ENVIRONMENT_TAG) {
    Sentry.setTag(
      'laudspeaker_environment',
      process.env.SENTRY_ENVIRONMENT_TAG
    );
  }

  global.timeoutIds = new Map<
    NodeJS.Timeout,
    { callback: Function; delay: number; args: any[] }
  >();

  function customSetTimeout(
    callback: (...args: any[]) => void,
    delay: number,
    ...args: any[]
  ): NodeJS.Timeout {
    const id: any = originalSetTimeout(
      () => {
        callback(...args);
        global.timeoutIds.delete(id);
      },
      delay,
      ...args
    );

    global.timeoutIds.set(id, { callback, delay, args });
    return id;
  }

  // Assuming you want to add __promisify__
  (customSetTimeout as any).__promisify__ = (delay: number, ...args: any[]) => {
    return new Promise((resolve) =>
      originalSetTimeout(resolve, delay, ...args)
    );
  };

  // Replace the global setTimeout
  global.setTimeout = customSetTimeout as any;

  global.intervalIds = new Map<
    NodeJS.Timeout,
    { callback: Function; delay: number; args: any[] }
  >();

  function customSetInterval(
    callback: (...args: any[]) => void,
    delay: number,
    ...args: any[]
  ): NodeJS.Timeout {
    const id: any = originalSetInterval(
      () => {
        callback(...args);
        global.intervalIds.delete(id);
      },
      delay,
      ...args
    );

    global.intervalIds.set(id, { callback, delay, args });
    return id;
  }

  // Assuming you want to add __promisify__
  (customSetInterval as any).__promisify__ = (
    delay: number,
    ...args: any[]
  ) => {
    return new Promise((resolve) =>
      originalSetInterval(resolve, delay, ...args)
    );
  };

  // Replace the global setTimeout
  global.setInterval = customSetInterval as any;

  async function bootstrap() {
    const httpsOptions = {
      key:
        parseInt(process.env.PORT) == 443
          ? readFileSync(process.env.KEY_PATH, 'utf8')
          : null,
      cert:
        parseInt(process.env.PORT) == 443
          ? readFileSync(process.env.CERT_PATH, 'utf8')
          : null,
    };

    expressApp.use(Sentry.Handlers.requestHandler());
    expressApp.use(Sentry.Handlers.tracingHandler());

    const app: NestExpressApplication = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
      {
        rawBody: true,
        httpsOptions:
          parseInt(process.env.PORT) == 443 ? httpsOptions : undefined,
      }
    );
    const port: number = parseInt(process.env.PORT);

    expressApp.use(Sentry.Handlers.errorHandler());

    const rawBodyBuffer = (req, res, buf, encoding) => {
      if (buf && buf.length) {
        req.rawBody = buf.toString(encoding || 'utf8');
      }
    };
    app.use(urlencoded({ verify: rawBodyBuffer, extended: true }));
    if (process.env.SERVE_CLIENT_FROM_NEST) app.setGlobalPrefix('api');
    app.set('trust proxy', 1);
    app.enableCors();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        exceptionFactory: (errors) =>
          console.log(JSON.stringify(errors, null, 2)),
      })
    );
    const logger = app.get(WINSTON_MODULE_NEST_PROVIDER);
    const morganMiddleware = morgan(
      ':method :url :status :res[content-length] :remote-addr :user-agent - :response-time ms :total-time ms',
      {
        stream: {
          // Configure Morgan to use our custom logger with the http severity
          write: (message) => logger.log(message.trim(), AppModule.name),
        },
      }
    );
    app.useLogger(logger);
    app.use(morganMiddleware);

    await app.listen(port, () => {
      console.log('[WEB]', `http://localhost:${port}`);
    });
  }

  bootstrap();
//}
