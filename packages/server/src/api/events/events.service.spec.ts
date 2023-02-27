import { TypeOrmConfigService } from '../../shared/typeorm/typeorm.service';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EventsService } from './events.service';
import { Account } from '../accounts/entities/accounts.entity';
import { Workflow } from '../workflows/entities/workflow.entity';
import { Template } from '../templates/entities/template.entity';
import { Audience } from '../audiences/entities/audience.entity';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import { Installation } from '../slack/entities/installation.entity';
import { CustomersService } from '../customers/customers.service';
import { AccountsService } from '../accounts/accounts.service';
import { TemplatesService } from '../templates/templates.service';
import { WorkflowsService } from '../workflows/workflows.service';
import { AudiencesService } from '../audiences/audiences.service';
import { EventsController } from './events.controller';
import { BullModule } from '@nestjs/bull';
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';

const papertrail = new winston.transports.Http({
  host: 'logs.collector.solarwinds.com',
  path: '/v1/log',
  auth: { username: 'papertrail', password: process.env.PAPERTRAIL_API_KEY },
  ssl: true,
});

describe('EventsService', () => {
  let service: EventsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forRootAsync({ useClass: TypeOrmConfigService }),
        MongooseModule.forRoot(process.env.MONGOOSE_URL),
        TypeOrmModule.forFeature([
          Account,
          Workflow,
          Template,
          Audience,
          Installation,
        ]),
        MongooseModule.forFeature([
          { name: Customer.name, schema: CustomerSchema },
        ]),
        BullModule.forRoot({
          redis: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT),
            password: process.env.REDIS_PASSWORD,
          },
        }),
        BullModule.registerQueue({
          name: 'message',
        }),
        BullModule.registerQueue({
          name: 'slack',
        }),
        WinstonModule.forRootAsync({
          useFactory: () => ({
            level: 'debug',
            transports: [papertrail],
          }),
          inject: [],
        }),
      ],
      controllers: [EventsController],
      providers: [
        EventsService,
        CustomersService,
        AccountsService,
        TemplatesService,
        WorkflowsService,
        AudiencesService,
      ],
    }).compile();

    service = module.get<EventsService>(EventsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
