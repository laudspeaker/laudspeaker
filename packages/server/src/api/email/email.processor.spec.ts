import { TypeOrmConfigService } from '../../shared/typeorm/typeorm.service';
import { BullModule } from '@nestjs/bull';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { Audience } from '../audiences/entities/audience.entity';
import { CustomersService } from '../customers/customers.service';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import { EmailController } from './email.controller';
import { EmailProcessor } from './email.processor';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

const papertrail = new winston.transports.Http({
  host: 'logs.collector.solarwinds.com',
  path: '/v1/log',
  auth: { username: 'papertrail', password: process.env.PAPERTRAIL_API_KEY },
  ssl: true,
});

describe('EmailService', () => {
  let service: EmailProcessor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
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
            transports: [papertrail],
          }),
          inject: [],
        }),
        TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService }),
        BullModule.registerQueue({
          name: 'email',
        }),
        TypeOrmModule.forFeature([Account]),
        TypeOrmModule.forFeature([Audience]),
        MongooseModule.forFeature([
          { name: Customer.name, schema: CustomerSchema },
        ]),
      ],
      controllers: [EmailController],
      providers: [EmailProcessor, CustomersService],
    }).compile();

    service = module.get<EmailProcessor>(EmailProcessor);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
