// DO NOT IMPORT ANYTHING BEFORE TRACER
import './tracer';
import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { urlencoded } from 'body-parser';
import { readFileSync } from 'fs';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';

Sentry.init({
  dsn: 'https://15c7f142467b67973258e7cfaf814500@o4506038702964736.ingest.sentry.io/4506040630640640',
  integrations: [new ProfilingIntegration()],
  // Performance Monitoring
  tracesSampleRate: 1.0, // Capture 100% of the transactions, reduce in production!
  // Set sampling rate for profiling - this is relative to tracesSampleRate
  profilesSampleRate: 1.0, // Capture 100% of the transactions, reduce in production!
});

const morgan = require('morgan');

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
  const app: NestExpressApplication = await NestFactory.create(AppModule, {
    rawBody: true,
    httpsOptions: parseInt(process.env.PORT) == 443 ? httpsOptions : undefined,
  });
  const port: number = parseInt(process.env.PORT);

  const rawBodyBuffer = (req, res, buf, encoding) => {
    if (buf && buf.length) {
      req.rawBody = buf.toString(encoding || 'utf8');
    }
  };
  app.use(urlencoded({ verify: rawBodyBuffer, extended: true }));
  if (process.env.SERVE_CLIENT_FROM_NEST) app.setGlobalPrefix('api');
  app.set('trust proxy', 1);
  app.enableCors();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
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
