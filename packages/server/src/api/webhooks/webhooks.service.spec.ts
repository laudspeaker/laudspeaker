import { Test, TestingModule } from '@nestjs/testing';
import { WebhooksService } from './webhooks.service';
import { WinstonModule } from 'nest-winston';
import winston from 'winston';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Audience } from '../audiences/entities/audience.entity';
import { TypeOrmConfigService } from '../../shared/typeorm/typeorm.service';
import { Account } from '../accounts/entities/accounts.entity';

describe('WebhooksService', () => {
  let service: WebhooksService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        WinstonModule.forRootAsync({
          useFactory: () => ({
            level: 'debug',
            transports: [
              new winston.transports.Console({
                handleExceptions: true,
                format: winston.format.combine(
                  winston.format.colorize(),
                  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' })
                ),
              }),
            ],
          }),
          inject: [],
        }),
        TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService }),
        TypeOrmModule.forFeature([Account, Audience]),
      ],
      providers: [WebhooksService],
    }).compile();

    service = module.get<WebhooksService>(WebhooksService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
