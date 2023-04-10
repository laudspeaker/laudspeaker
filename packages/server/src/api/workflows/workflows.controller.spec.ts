import { TypeOrmConfigService } from '../../shared/typeorm/typeorm.service';
import { BullModule } from '@nestjs/bullmq';
import { MongooseModule } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WinstonModule } from 'nest-winston';
import { AudiencesService } from '../audiences/audiences.service';
import { Audience } from '../audiences/entities/audience.entity';
import { CustomersService } from '../customers/customers.service';
import { Customer, CustomerSchema } from '../customers/schemas/customer.schema';
import { Workflow } from './entities/workflow.entity';
import { WorkflowsController } from './workflows.controller';
import { WorkflowsService } from './workflows.service';
import * as winston from 'winston';

const papertrail = new winston.transports.Http({
  host: 'logs.collector.solarwinds.com',
  path: '/v1/log',
  auth: { username: 'papertrail', password: process.env.PAPERTRAIL_API_KEY },
  ssl: true,
});

describe('WorkflowsController', () => {
  let controller: WorkflowsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(process.env.MONGOOSE_URL),
        BullModule.forRoot({
          connection: {
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
        TypeOrmModule.forFeature([Workflow, Audience]),
        MongooseModule.forFeature([
          { name: Customer.name, schema: CustomerSchema },
        ]),
      ],
      controllers: [WorkflowsController],
      providers: [WorkflowsService, AudiencesService, CustomersService],
    }).compile();

    controller = module.get<WorkflowsController>(WorkflowsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
