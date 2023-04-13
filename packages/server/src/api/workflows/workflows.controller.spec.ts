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
import { Account } from '../accounts/entities/accounts.entity';
import { Installation } from '../slack/entities/installation.entity';
import { Filter } from '../filter/entities/filter.entity';
import { State } from '../slack/entities/state.entity';
import { Template } from '../templates/entities/template.entity';
import { EventKeys, EventKeysSchema } from '../events/schemas/event-keys.schema';
import { CustomerKeys, CustomerKeysSchema } from '../customers/schemas/customer-keys.schema';

describe('WorkflowsController', () => {
  let controller: WorkflowsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TypeOrmModule.forFeature([
          Account,
          Audience,
          Installation,
          Filter,
          State,
          Template,
          Workflow,
        ]),
        BullModule.forRoot({
          connection: {
            host: process.env.REDIS_HOST,
            port: parseInt(process.env.REDIS_PORT),
            password: process.env.REDIS_PASSWORD,
          },
        }),
        MongooseModule.forFeature([
          { name: Customer.name, schema: CustomerSchema },
          { name: EventKeys.name, schema: EventKeysSchema },
        ]),
        MongooseModule.forFeature([
          { name: CustomerKeys.name, schema: CustomerKeysSchema },
        ]),
        BullModule.registerQueue({
          name: 'message',
        }),
        BullModule.registerQueue({
          name: 'slack',
        }),
        BullModule.registerQueue({
          name: 'customers',
        }),
        BullModule.registerQueue({
          name: 'events',
        })
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
