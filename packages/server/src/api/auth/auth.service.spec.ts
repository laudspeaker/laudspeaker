import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { DataSource, Repository } from 'typeorm';
import { createMock } from '@golevelup/ts-jest';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { getQueueToken } from '@nestjs/bullmq';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Account } from 'aws-sdk';
import { Verification } from './entities/verification.entity';
import { Recovery } from './entities/recovery.entity';
import { AuthHelper } from './auth.helper';
import { CustomersService } from '../customers/customers.service';
import { getConnectionToken } from '@nestjs/mongoose';

describe('AuthService', () => {
  let service: AuthService;
  let repository: Repository<Account>;

  beforeEach(async () => {
    const moduleRef: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: DataSource,
          useValue: createMock<DataSource>(),
        },
        {
          provide: WINSTON_MODULE_NEST_PROVIDER,
          useValue: {
            log: jest.fn(),
            debug: jest.fn(),
            info: jest.fn(),
            warn: jest.fn(),
            error: jest.fn(),
          },
        },
        {
          provide: getQueueToken('message'),
          useValue: { add: jest.fn() },
        },
        {
          provide: getRepositoryToken(Account),
          useClass: Repository,
        },
        {
          provide: getRepositoryToken(Verification),
          useValue: {},
        },
        {
          provide: getRepositoryToken(Recovery),
          useValue: createMock(),
        },
        {
          provide: AuthHelper,
          useValue: createMock<AuthHelper>(),
        },
        {
          provide: CustomersService,
          useValue: createMock<CustomersService>(),
        },
        {
          provide: getConnectionToken(),
          useValue: { add: jest.fn() },
        },
      ],
    }).compile();

    service = moduleRef.get<AuthService>(AuthService);
    repository = moduleRef.get<Repository<Account>>(
      getRepositoryToken(Account)
    );
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
