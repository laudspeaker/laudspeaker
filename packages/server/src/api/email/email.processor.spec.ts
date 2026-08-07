import { TypeOrmConfigService } from '../../shared/typeorm/typeorm.service';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Account } from '../accounts/entities/accounts.entity';
import { CustomersService } from '../customers/customers.service';
import { EmailController } from './email.controller';
import { MessageProcessor } from './email.processor';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

const papertrail = new winston.transports.Http({
  host: 'logs.collector.solarwinds.com',
  path: '/v1/log',
  auth: { username: 'papertrail', password: process.env.PAPERTRAIL_API_KEY },
  ssl: true,
});

describe('EmailService', () => {
  let service: MessageProcessor;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        WinstonModule.forRootAsync({
          useFactory: () => ({
            level: 'debug',
            transports: [papertrail],
          }),
          inject: [],
        }),
        TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService }),
        TypeOrmModule.forFeature([Account]),
      ],
      controllers: [EmailController],
      providers: [MessageProcessor, CustomersService],
    }).compile();

    service = module.get<MessageProcessor>(MessageProcessor);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
