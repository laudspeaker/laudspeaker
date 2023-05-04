import { Test, TestingModule } from '@nestjs/testing';
import { TemplatesController } from './templates.controller';
import { TemplatesService } from './templates.service';
import { TemplatesModule } from './templates.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MongooseModule } from '@nestjs/mongoose';
import { BullModule } from '@nestjs/bullmq';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { Account } from '../accounts/entities/accounts.entity';
import { Audience } from '../audiences/entities/audience.entity';
import { Installation } from '../slack/entities/installation.entity';
import { State } from '../slack/entities/state.entity';
import { Template } from './entities/template.entity';
import { TypeOrmConfigService } from '@/shared/typeorm/typeorm.service';

describe('TemplatesController', () => {
  let controller: TemplatesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [
        TemplatesModule,
        TypeOrmModule.forFeature([
          Account,
          Audience,
          Installation,
          State,
          Template,
        ]),
        MongooseModule.forRoot(process.env.MONGOOSE_URL),
        BullModule.forRoot({
          connection: {
            host: process.env.REDIS_HOST ?? 'localhost',
            port: parseInt(process.env.REDIS_PORT),
            password: process.env.REDIS_PASSWORD,
            retryStrategy: (times: number) => {
              return Math.max(Math.min(Math.exp(times), 20000), 1000);
            },
            maxRetriesPerRequest: null,
            enableOfflineQueue: true,
          },
        }),
      ],
    })
      .overrideProvider(getRepositoryToken(Account))
      .useValue({})
      .overrideProvider(getRepositoryToken(Audience))
      .useValue({})
      .overrideProvider(getRepositoryToken(Installation))
      .useValue({})
      .overrideProvider(getRepositoryToken(State))
      .useValue({})
      .overrideProvider(getRepositoryToken(Template))
      .useValue({})
      .compile();

    controller = module.get<TemplatesController>(TemplatesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
