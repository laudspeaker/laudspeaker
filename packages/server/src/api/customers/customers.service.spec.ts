import { getModelToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { CustomersService } from './customers.service';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { getQueueToken } from '@nestjs/bullmq';
import { DataSource, Repository } from 'typeorm';
import { createMock } from '@golevelup/ts-jest';
import { SegmentsService } from '../segments/segments.service';
import { Account } from 'aws-sdk';
import { getRepositoryToken } from '@nestjs/typeorm';

describe('CustomersService', () => {
  let service: CustomersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CustomersService,
        {
          provide: SegmentsService,
          useValue: createMock<SegmentsService>(),
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
          provide: getQueueToken('customers'),
          useValue: { add: jest.fn() },
        },
        {
          provide: getModelToken('Customer'),
          useValue: { add: jest.fn() },
        },
        {
          provide: getModelToken('CustomerKeys'),
          useValue: { add: jest.fn() },
        },
        {
          provide: DataSource,
          useValue: createMock<DataSource>(),
        },
        {
          provide: getRepositoryToken(Account),
          useClass: Repository,
        },
      ],
    }).compile();

    service = module.get<CustomersService>(CustomersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
